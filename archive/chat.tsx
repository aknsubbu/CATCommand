import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Transformers.js for embeddings
import { env, FeatureExtractionPipeline, pipeline } from '@xenova/transformers';

// Configure for mobile/local use
env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = false;

// Types
interface FAQEntry {
  question: string;
  embedding: number[];
  answer: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  matchedQuestion?: string;
  confidence?: number;
  method?: 'embedding' | 'keyword';
}

interface SearchMatch {
  question: string;
  embedding: number[];
  answer: string;
  confidence: number;
  method: 'embedding' | 'keyword';
  score?: number;
}

interface ModelProgress {
  status: string;
  loaded?: number;
  total?: number;
}

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [faqData, setFaqData] = useState<FAQEntry[]>([]);
  const [model, setModel] = useState<FeatureExtractionPipeline | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelProgress, setModelProgress] = useState<string>('Initializing...');
  const flatListRef = useRef<FlatList<Message>>(null);

  // Load FAQ data and initialize model
  const initializeChat = useCallback(async () => {
    try {
      setIsModelLoading(true);
      
      // Step 1: Load FAQ data
      setModelProgress('Loading FAQ data...');
      await loadFaqData();
      
      // Step 2: Initialize embedding model
      setModelProgress('Loading AI model (this may take a minute)...');
      await initializeModel();
      
    } catch (error) {
      console.error('Error initializing chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Initialization Error', `Failed to initialize: ${errorMessage}\n\nFalling back to keyword search.`);
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const loadFaqData = async (): Promise<void> => {
    try {
      // Load from assets/data/questions.json
      const asset = Asset.fromModule(require('/data/questions.json'));
      await asset.downloadAsync();
      
      console.log('Asset downloaded, loading file...');
      const fileContent = await FileSystem.readAsStringAsync(asset.localUri!);
      const data = JSON.parse(fileContent);
      
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('FAQ data must be an array');
      }
      
      // Filter and validate entries
      const validData = data.filter((entry: any): entry is FAQEntry => {
        const hasRequired = entry.question && entry.answer;
        const hasEmbedding = entry.embedding && Array.isArray(entry.embedding) && entry.embedding.length > 0;
        
        if (!hasRequired) {
          console.warn('Skipping entry without question/answer:', entry);
          return false;
        }
        if (!hasEmbedding) {
          console.warn('Skipping entry without valid embedding:', entry.question?.substring(0, 50));
          return false;
        }
        
        return true;
      });
      
      if (validData.length === 0) {
        throw new Error('No valid FAQ entries with embeddings found');
      }
      
      setFaqData(validData);
      console.log(`✅ Loaded ${validData.length} valid FAQ entries with embeddings`);
      console.log(`📏 Embedding dimension: ${validData[0].embedding.length}`);
      
      // Add welcome message after data is loaded
      addMessage('bot', `🤖 Hello! I'm your AI-powered FAQ assistant with ${validData.length} answers ready. I use semantic search to understand your questions better. What would you like to know?`);
      
    } catch (error) {
      console.error('Error loading FAQ data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load FAQ data: ${errorMessage}`);
    }
  };

  const initializeModel = async (): Promise<void> => {
    try {
      console.log('🧠 Loading embedding model...');
      
      // Use the same model that was used to generate embeddings
      const embeddingModel = await pipeline(
        'feature-extraction', 
        'Xenova/all-MiniLM-L6-v2',
        {
          progress_callback: (progress: ModelProgress) => {
            if (progress.status === 'downloading' && progress.loaded && progress.total) {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setModelProgress(`Downloading model: ${percent}%`);
            } else if (progress.status === 'loading') {
              setModelProgress('Loading model into memory...');
            }
          }
        }
      );
      
      setModel(embeddingModel);
      console.log('✅ Embedding model loaded successfully');
      
      // Test the model with a sample query
      const testEmbedding = await embeddingModel('test query', { 
        pooling: 'mean', 
        normalize: true 
      });
      console.log(`🔬 Model test successful, output dimension: ${testEmbedding.data.length}`);
      
    } catch (error) {
      console.error('❌ Error loading embedding model:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load AI model: ${errorMessage}`);
    }
  };

  // Cosine similarity function
  const cosineSimilarity = (a: number[], b: number[]): number => {
    if (a.length !== b.length) {
      console.error('Vector dimensions do not match:', a.length, 'vs', b.length);
      return 0;
    }
    
    const dot = a.reduce((sum: number, val: number, i: number) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum: number, val: number) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum: number, val: number) => sum + val * val, 0));
    
    if (normA === 0 || normB === 0) return 0;
    
    return dot / (normA * normB);
  };

  // Enhanced keyword-based matching (fallback)
  const keywordBasedSearch = (userQuery: string): SearchMatch | null => {
    const queryWords = userQuery.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word: string) => word.length > 2);
    
    let bestScore = 0;
    let bestMatch: FAQEntry | null = null;
    let allMatches: { entry: FAQEntry; score: number }[] = [];

    for (const entry of faqData) {
      const questionWords = entry.question.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/);
      const answerWords = entry.answer.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/);
      
      let score = 0;
      
      // Exact phrase matching
      if (entry.question.toLowerCase().includes(userQuery.toLowerCase())) {
        score += 15;
      }
      
      // Word-by-word matching
      for (const word of queryWords) {
        if (questionWords.includes(word)) {
          score += 5;
        } else if (questionWords.some((qWord: string) => qWord.includes(word) || word.includes(qWord))) {
          score += 3;
        } else if (answerWords.some((aWord: string) => aWord.includes(word) || word.includes(aWord))) {
          score += 1;
        }
      }
      
      // Bonus for multiple matches
      const matchingWords = queryWords.filter((word: string) => 
        questionWords.some((qWord: string) => qWord.includes(word) || word.includes(qWord))
      );
      if (matchingWords.length > 1) {
        score += matchingWords.length * 2;
      }
      
      if (score > 0) {
        allMatches.push({ entry, score });
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    // Log top matches for debugging
    allMatches.sort((a, b) => b.score - a.score);
    console.log('🔍 Top keyword matches:');
    allMatches.slice(0, 3).forEach((item, i) => {
      console.log(`${i + 1}. Score: ${item.score}, Q: ${item.entry.question.substring(0, 50)}...`);
    });

    if (bestMatch && bestScore > 0) {
      return {
        ...bestMatch,
        score: bestScore,
        confidence: Math.min(bestScore / 20, 1),
        method: 'keyword'
      };
    }
    
    return null;
  };

  // Main search function using embeddings
  const getBestAnswer = async (userQuery: string): Promise<SearchMatch | null> => {
    try {
      console.log(`\n🔍 Searching for: "${userQuery}"`);
      
      // Method 1: Embedding-based similarity (preferred)
      if (model && faqData.length > 0) {
        console.log('🧠 Using AI embedding search...');
        
        try {
          // Generate embedding for user query
          const queryEmbedding = await model(userQuery, { 
            pooling: 'mean', 
            normalize: true 
          });
          const queryVector = Array.from(queryEmbedding.data);
          
          console.log(`📐 Query embedding generated, dimension: ${queryVector.length}`);
          
          let bestScore = -1;
          let bestMatch: FAQEntry | null = null;
          let allScores: { entry: FAQEntry; score: number; index: number }[] = [];

          // Compare with all FAQ embeddings
          for (let i = 0; i < faqData.length; i++) {
            const entry = faqData[i];
            const score = cosineSimilarity(queryVector, entry.embedding);
            allScores.push({ entry, score, index: i });
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = entry;
            }
          }

          // Log top embedding matches
          allScores.sort((a, b) => b.score - a.score);
          console.log('🎯 Top embedding matches:');
          allScores.slice(0, 3).forEach((item, i) => {
            console.log(`${i + 1}. Score: ${item.score.toFixed(4)}, Q: ${item.entry.question.substring(0, 50)}...`);
          });

          // Use embedding result if confidence is reasonable
          if (bestMatch && bestScore > 0.2) { // Lower threshold for better recall
            console.log(`✅ Selected embedding match with score: ${bestScore.toFixed(4)}`);
            return {
              ...bestMatch,
              confidence: bestScore,
              method: 'embedding'
            };
          } else {
            console.log(`⚠️ Best embedding score (${bestScore.toFixed(4)}) below threshold`);
          }
          
        } catch (embeddingError) {
          console.error('❌ Error in embedding search:', embeddingError);
        }
      }

      // Method 2: Keyword-based search (fallback)
      console.log('🔤 Using keyword search...');
      const keywordMatch = keywordBasedSearch(userQuery);
      if (keywordMatch) {
        console.log(`✅ Selected keyword match with score: ${keywordMatch.score} (normalized: ${keywordMatch.confidence.toFixed(3)})`);
        return keywordMatch;
      }

      console.log('❌ No good matches found');
      return null;

    } catch (error) {
      console.error('💥 Error in getBestAnswer:', error);
      return null;
    }
  };

  const addMessage = (sender: 'user' | 'bot', text: string, metadata: Partial<Message> = {}): void => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      sender,
      text,
      timestamp: new Date(),
      ...metadata
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputText.trim()) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    
    // Add user message
    addMessage('user', userMessage);
    
    // Show typing indicator
    setIsLoading(true);
    
    try {
      // Get best answer
      const bestMatch = await getBestAnswer(userMessage);
      
      if (bestMatch) {
        // Add bot response with metadata
        const confidencePercent = Math.round(bestMatch.confidence * 100);
        let responseText = bestMatch.answer;
        
        // Add confidence indicator for low-confidence matches
        if (bestMatch.confidence < 0.5) {
          responseText += `\n\n💡 This answer has ${confidencePercent}% confidence. If this doesn't help, try rephrasing your question.`;
        }
        
        addMessage('bot', responseText, {
          matchedQuestion: bestMatch.question,
          confidence: bestMatch.confidence,
          method: bestMatch.method
        });
      } else {
        // No match found - show helpful suggestions
        const randomSuggestions = faqData
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(item => `• ${item.question}`);
          
        const fallbackMessage = `I couldn't find a good answer to &quot;${userMessage}&quot;. Here are some topics I can help with:\n\n${randomSuggestions.join('\n')}\n\nTry rephrasing your question or ask about one of these topics.`;
        addMessage('bot', fallbackMessage);
      }
      
    } catch (error) {
      console.error('💥 Error processing message:', error);
      addMessage('bot', "Sorry, I encountered an error while processing your question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.botMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.botText
          ]}>
            {item.text}
          </Text>
          
          {/* Show matched question for bot responses */}
          {!isUser && item.matchedQuestion && (
            <Text style={styles.matchedQuestion}>
              💡 Based on: &quot;{item.matchedQuestion}&quot;
            </Text>
          )}
          
          {/* Show confidence and method */}
          {!isUser && item.confidence && (
            <View style={styles.metadataContainer}>
              <Text style={styles.confidence}>
                {item.method === 'embedding' ? '🧠 AI' : '🔍 Keyword'} • {(item.confidence * 100).toFixed(0)}% confidence
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderSuggestedQuestions = (): React.ReactElement | null => {
    if (messages.length > 1 || faqData.length === 0) return null;
    
    // Show diverse questions as suggestions
    const suggestions = faqData
      .sort(() => 0.5 - Math.random()) // Randomize
      .slice(0, 4)
      .map(item => item.question);
    
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>💬 Try asking about:</Text>
        {suggestions.map((question, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionButton}
            onPress={() => {
              setInputText(question);
            }}
          >
            <Text style={styles.suggestionText} numberOfLines={2}>
              {question}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isModelLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Setting up AI Assistant</Text>
        <Text style={styles.loadingSubtext}>{modelProgress}</Text>
        {modelProgress.includes('%') && (
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill, 
              { width: `${parseInt(modelProgress)}%` }
            ]} />
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI FAQ Assistant</Text>
        <Text style={styles.headerSubtitle}>
          {faqData.length} answers • {model ? '🧠 AI-powered' : '🔍 Keyword search'}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      {renderSuggestedQuestions()}

      {isLoading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.typingText}>
            {model ? 'AI is thinking...' : 'Searching...'}
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={model ? "Ask me anything (AI-powered)..." : "Ask me anything..."}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  botBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#000',
  },
  matchedQuestion: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    opacity: 0.7,
    color: '#666',
  },
  metadataContainer: {
    marginTop: 6,
  },
  confidence: {
    fontSize: 10,
    opacity: 0.6,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 8,
  },
  suggestionsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  suggestionButton: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 18,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ChatScreen;