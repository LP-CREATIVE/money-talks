import React, { useState, useEffect } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import EmploymentHistory from './EmploymentHistory';
import ObservablePatterns from './ObservablePatterns';
import ExpertiseAreas from './ExpertiseAreas';
import CompanyRelationships from './CompanyRelationships';
import ConnectionsNetwork from './ConnectionsNetwork';
import ProfileReview from './ProfileReview';
import { expertOnboarding } from '../../services/api';

const ExpertOnboardingStepper = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    employment: [],
    observablePatterns: [],
    expertise: [],
    companyRelationships: [],
    connections: []
  });

  const handleNext = (data) => {
    setProfileData({ ...profileData, ...data });
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - complete onboarding
      if (onComplete) {
        onComplete();
      }
    }
  };  const [loading, setLoading] = useState(false);

  const steps = [
    { 
      title: 'Employment History', 
      component: EmploymentHistory,
      description: 'Tell us about your work experience'
    },
    { 
      title: 'Observable Patterns', 
      component: ObservablePatterns,
      description: 'What operational patterns can you observe?'
    },
    { 
      title: 'Expertise Areas', 
      component: ExpertiseAreas,
      description: 'Define your areas of expertise'
    },
    { 
      title: 'Company Relationships', 
      component: CompanyRelationships,
      description: 'Map your business network'
    },
    { 
      title: 'Professional Network', 
      component: ConnectionsNetwork,
      description: 'Add your professional connections'
    },
    { 
      title: 'Review & Submit', 
      component: ProfileReview,
      description: 'Review your expert profile'
    }
  ];

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const response = await expertOnboarding.getProfile();
      if (response.data.profile) {
        setProfileData({
          employment: response.data.profile.employmentHistory || [],
          observablePatterns: response.data.profile.observablePatterns || [],
          expertise: response.data.profile.expertiseAreas || [],
          companyRelationships: response.data.profile.companyRelationships || [],
          connections: response.data.profile.connections || []
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleStepComplete = (stepData) => {
    const stepKey = Object.keys(stepData)[0];
    setProfileData(prev => ({
      ...prev,
      [stepKey]: stepData[stepKey]
    }));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const StepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Expert Profile Setup</h1>
          <p className="text-gray-400">Complete your profile to unlock expert opportunities</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index < currentStep ? 'bg-green-600 text-white' :
                    index === currentStep ? 'bg-blue-600 text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {index < currentStep ? <Check size={20} /> : index + 1}
                  </div>
                  <span className={`text-xs mt-2 ${
                    index <= currentStep ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-400">
              {steps[currentStep].description}
            </p>
          </div>

          <StepComponent
            onComplete={handleNext}
            data={profileData}
            onBack={handleBack}
          />
        </div>

        <div className="mt-6 flex justify-between">
          <div className="text-sm text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="text-sm text-gray-400">
            Profile Completeness: {Math.round((currentStep / steps.length) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertOnboardingStepper;
