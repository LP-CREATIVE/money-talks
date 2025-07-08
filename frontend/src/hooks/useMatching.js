import { useQuery, useMutation } from '@tanstack/react-query';
import { matching } from '../services/api';

export const useExpertMatches = (questionId, options = {}) => {
  return useQuery({
    queryKey: ['expertMatches', questionId, options],
    queryFn: () => matching.findExperts(questionId, options),
    enabled: !!questionId,
  });
};

export const useNotifyExperts = () => {
  return useMutation({
    mutationFn: ({ questionId, expertIds }) => 
      matching.notifyExperts(questionId, expertIds),
  });
};
