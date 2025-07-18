import AsyncStorage from '@react-native-async-storage/async-storage';
import FirestoreService, { TrainingModule } from './FirestoreService';
import { Alert } from './alertService';

// Maps alert titles to training module categories or keywords
const alertToTrainingMap: Record<string, { category?: string; keywords?: string[] }> = {
  'Critical Safety Alert: Seatbelt Unfastened': { category: 'safety', keywords: ['seatbelt'] },
  'Efficiency Warning: Excessive Idling': { category: 'efficiency', keywords: ['idling', 'fuel'] },
  'Engine Critical: Low Oil Pressure': { category: 'maintenance', keywords: ['oil pressure', 'engine'] },
  'Brake System Warning: Abnormal Pressure': { category: 'maintenance', keywords: ['brake'] },
  'Operational Feedback: Aggressive Driving': { category: 'operation', keywords: ['aggressive', 'smooth'] },
  'Environmental Info: High Ambient Temperature': { category: 'operation', keywords: ['temperature', 'cooling'] },
};

export interface TrainingSuggestion {
  type: 'training_suggestion';
  title: string;
  message: string;
  trainingModuleId: string;
  trainingModuleTitle: string;
}

const TRAINING_MODULE_CACHE_PREFIX = '@TrainingModuleCache:';

class TrainingSuggestionService {
  async getSuggestionForAlert(alert: Alert): Promise<TrainingSuggestion | null> {
    const mapping = alertToTrainingMap[alert.title];
    if (!mapping) {
      return null;
    }

    try {
      const allModules = await FirestoreService.getAll<TrainingModule>(FirestoreService.collections.TRAINING_MODULES);

      let bestMatch: TrainingModule | null = null;

      if (allModules && allModules.length > 0) {
        // Find a module that matches the category and at least one keyword
        bestMatch = allModules.find(module => 
          (mapping.category ? module.category.toLowerCase() === mapping.category.toLowerCase() : true) &&
          (mapping.keywords ? mapping.keywords.some(keyword => module.title.toLowerCase().includes(keyword) || module.description.toLowerCase().includes(keyword)) : true)
        ) || null;

        // Cache all fetched modules
        for (const module of allModules) {
          await AsyncStorage.setItem(`${TRAINING_MODULE_CACHE_PREFIX}${module.id}`, JSON.stringify(module));
        }
      }

      if (bestMatch) {
        return {
          type: 'training_suggestion',
          title: 'Training Recommendation',
          message: `Based on the recent alert for "${alert.title}", we recommend the following training: `,
          trainingModuleId: bestMatch.id,
          trainingModuleTitle: bestMatch.title,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching training modules:', error);
      return null;
    }
  }
}

export default new TrainingSuggestionService();
