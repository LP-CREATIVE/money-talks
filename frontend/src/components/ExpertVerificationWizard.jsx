import React, { useState } from 'react';
import { 
  User, Briefcase, GraduationCap, Award, FileCheck, 
  UserCheck, ChevronRight, ChevronLeft, Check, Upload,
  Linkedin, Mail, Video, Camera, FileText, Building
} from 'lucide-react';

const ExpertVerificationWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: '',
    currentRole: '',
    currentEmployer: '',
    yearsInIndustry: '',
    
    // Expertise
    primaryIndustry: '',
    secondaryIndustries: [],
    functionalExpertise: {
      primary: '',
      secondary: []
    },
    specificExpertiseTags: [],
    geographicExpertise: [],
    
    // Education
    education: [],
    
    // Certifications
    certifications: [],
    
    // References
    references: [],
    
    // Evidence
    evidence: {
      paystub: null,
      workBadge: null,
      internalScreenshot: null,
      linkedinProfile: '',
      workEmail: '',
      videoIntroduction: null
    },
    
    // Self Assessment
    confidenceRating: 5,
    uncertaintyAwareness: ''
  });

  const steps = [
    { title: 'Basic Information', icon: User },
    { title: 'Professional Background', icon: Briefcase },
    { title: 'Education & Certifications', icon: GraduationCap },
    { title: 'Verification Evidence', icon: FileCheck },
    { title: 'References', icon: UserCheck },
    { title: 'Self Assessment', icon: Award }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInformationStep formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <ProfessionalBackgroundStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <EducationCertificationStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <VerificationEvidenceStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <ReferencesStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <SelfAssessmentStep formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full
                ${index < currentStep ? 'bg-green-600 text-white' : 
                  index === currentStep ? 'bg-purple-600 text-white' : 
                  'bg-gray-700 text-gray-400'}
              `}>
                {index < currentStep ? <Check size={20} /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-1 mx-2 ${
                  index < currentStep ? 'bg-green-600' : 'bg-gray-700'
                }`} style={{ width: '100px' }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          {steps.map((step, index) => (
            <div key={index} className="text-center" style={{ width: '100px' }}>
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Header */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-purple-600 rounded-lg">
            <StepIcon size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {steps[currentStep].title}
            </h2>
            <p className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
          Previous
        </button>
        
        {currentStep === steps.length - 1 ? (
          <button
            onClick={() => onComplete(formData)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Complete Verification
            <Check size={20} />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Next
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

// Step 1: Basic Information
const BasicInformationStep = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => updateFormData('fullName', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Current Role
        </label>
        <input
          type="text"
          value={formData.currentRole}
          onChange={(e) => updateFormData('currentRole', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
          placeholder="Senior Investment Analyst"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Current Employer
        </label>
        <input
          type="text"
          value={formData.currentEmployer}
          onChange={(e) => updateFormData('currentEmployer', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
          placeholder="Goldman Sachs"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Years in Industry
        </label>
        <input
          type="number"
          value={formData.yearsInIndustry}
          onChange={(e) => updateFormData('yearsInIndustry', parseInt(e.target.value) || 0)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
          placeholder="10"
        />
      </div>
    </div>
  );
};

// Step 2: Professional Background
const ProfessionalBackgroundStep = ({ formData, updateFormData }) => {
  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Real Estate', 'Energy',
    'Consumer Goods', 'Manufacturing', 'Retail', 'Transportation'
  ];

  const functionalAreas = [
    'Equity Research', 'Investment Banking', 'Private Equity',
    'Venture Capital', 'Asset Management', 'Corporate Finance',
    'Risk Management', 'Quantitative Analysis'
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Primary Industry Expertise
        </label>
        <select
          value={formData.primaryIndustry}
          onChange={(e) => updateFormData('primaryIndustry', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
        >
          <option value="">Select Industry</option>
          {industries.map(industry => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Primary Functional Expertise
        </label>
        <select
          value={formData.functionalExpertise.primary}
          onChange={(e) => updateFormData('functionalExpertise', {
            ...formData.functionalExpertise,
            primary: e.target.value
          })}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
        >
          <option value="">Select Functional Area</option>
          {functionalAreas.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Specific Expertise Tags
        </label>
        <input
          type="text"
          placeholder="e.g., SaaS metrics, DCF modeling, Tech valuations"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const tag = e.target.value.trim();
              if (tag && !formData.specificExpertiseTags.includes(tag)) {
                updateFormData('specificExpertiseTags', [...formData.specificExpertiseTags, tag]);
                e.target.value = '';
              }
            }
          }}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.specificExpertiseTags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => updateFormData('specificExpertiseTags', 
                  formData.specificExpertiseTags.filter((_, i) => i !== index)
                )}
                className="hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Step 3: Education & Certifications
const EducationCertificationStep = ({ formData, updateFormData }) => {
  const [newEducation, setNewEducation] = useState({
    degree: '',
    institution: '',
    graduationYear: ''
  });

  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    dateObtained: ''
  });

  const addEducation = () => {
    if (newEducation.degree && newEducation.institution) {
      updateFormData('education', [...formData.education, newEducation]);
      setNewEducation({ degree: '', institution: '', graduationYear: '' });
    }
  };

  const addCertification = () => {
    if (newCertification.name && newCertification.issuer) {
      updateFormData('certifications', [...formData.certifications, newCertification]);
      setNewCertification({ name: '', issuer: '', dateObtained: '' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Education */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Education</h3>
        
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Degree (e.g., MBA, CFA)"
            value={newEducation.degree}
            onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <input
            type="text"
            placeholder="Institution"
            value={newEducation.institution}
            onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <input
            type="number"
            placeholder="Graduation Year"
            value={newEducation.graduationYear}
            onChange={(e) => setNewEducation({...newEducation, graduationYear: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <button
            onClick={addEducation}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Add Education
          </button>
        </div>

        {formData.education.map((edu, index) => (
          <div key={index} className="bg-gray-700 p-3 rounded-lg mb-2">
            <p className="text-white font-medium">{edu.degree}</p>
            <p className="text-sm text-gray-400">{edu.institution} • {edu.graduationYear}</p>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Professional Certifications</h3>
        
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Certification Name"
            value={newCertification.name}
            onChange={(e) => setNewCertification({...newCertification, name: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <input
            type="text"
            placeholder="Issuing Organization"
            value={newCertification.issuer}
            onChange={(e) => setNewCertification({...newCertification, issuer: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <input
            type="date"
            value={newCertification.dateObtained}
            onChange={(e) => setNewCertification({...newCertification, dateObtained: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <button
            onClick={addCertification}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Add Certification
          </button>
        </div>

        {formData.certifications.map((cert, index) => (
          <div key={index} className="bg-gray-700 p-3 rounded-lg mb-2">
            <p className="text-white font-medium">{cert.name}</p>
            <p className="text-sm text-gray-400">{cert.issuer} • {cert.dateObtained}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Step 4: Verification Evidence
const VerificationEvidenceStep = ({ formData, updateFormData }) => {
  const evidenceTypes = [
    {
      key: 'paystub',
      title: 'Recent Paystub',
      description: 'Upload a redacted paystub showing employer name',
      icon: FileText,
      weight: '20%'
    },
    {
      key: 'workBadge',
      title: 'Work Badge Photo',
      description: 'Photo of your company ID or access badge',
      icon: Camera,
      weight: '20%'
    },
    {
      key: 'internalScreenshot',
      title: 'Internal Tool Screenshot',
      description: 'Screenshot of internal company system (redacted)',
      icon: Building,
      weight: '25%'
    },
    {
      key: 'linkedinProfile',
      title: 'LinkedIn Profile',
      description: 'Link to your professional LinkedIn profile',
      icon: Linkedin,
      weight: '10%'
    },
    {
      key: 'workEmail',
      title: 'Work Email Verification',
      description: 'Verify using your corporate email address',
      icon: Mail,
      weight: '15%'
    },
    {
      key: 'videoIntroduction',
      title: 'Video Introduction',
      description: '30-second video introducing yourself',
      icon: Video,
      weight: '10%'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-400">
          Upload at least 2 forms of evidence to reach Professional verification level.
          More evidence increases your verification score and earning potential.
        </p>
      </div>

      {evidenceTypes.map((evidence) => {
        const Icon = evidence.icon;
        const isUploaded = evidence.key === 'linkedinProfile' || evidence.key === 'workEmail' 
          ? !!formData.evidence[evidence.key]
          : formData.evidence[evidence.key] !== null;

        return (
          <div key={evidence.key} className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isUploaded ? 'bg-green-600' : 'bg-gray-600'}`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{evidence.title}</h4>
                  <p className="text-sm text-gray-400">{evidence.description}</p>
                </div>
              </div>
              <span className="text-sm text-purple-400 font-medium">
                Weight: {evidence.weight}
              </span>
            </div>

            {evidence.key === 'linkedinProfile' ? (
              <input
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.evidence.linkedinProfile}
                onChange={(e) => updateFormData('evidence', {
                  ...formData.evidence,
                  linkedinProfile: e.target.value
                })}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white mt-2"
              />
            ) : evidence.key === 'workEmail' ? (
              <input
                type="email"
                placeholder="you@company.com"
                value={formData.evidence.workEmail}
                onChange={(e) => updateFormData('evidence', {
                  ...formData.evidence,
                  workEmail: e.target.value
                })}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white mt-2"
              />
            ) : (
              <button className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2">
                <Upload size={16} />
                Upload {evidence.title}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Step 5: References
const ReferencesStep = ({ formData, updateFormData }) => {
  const [newReference, setNewReference] = useState({
    name: '',
    title: '',
    company: '',
    email: ''
  });

  const addReference = () => {
    if (newReference.name && newReference.email) {
      updateFormData('references', [...formData.references, newReference]);
      setNewReference({ name: '', title: '', company: '', email: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-400">
          Professional references help verify your experience and increase trust.
          We'll send them a brief verification email.
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Reference Name"
          value={newReference.name}
          onChange={(e) => setNewReference({...newReference, name: e.target.value})}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
        />
        <input
          type="text"
          placeholder="Title"
          value={newReference.title}
          onChange={(e) => setNewReference({...newReference, title: e.target.value})}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
        />
        <input
          type="text"
          placeholder="Company"
          value={newReference.company}
          onChange={(e) => setNewReference({...newReference, company: e.target.value})}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
        />
        <input
          type="email"
          placeholder="Email"
          value={newReference.email}
          onChange={(e) => setNewReference({...newReference, email: e.target.value})}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
        />
        <button
          onClick={addReference}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          Add Reference
        </button>
      </div>

      <div className="space-y-3">
        {formData.references.map((ref, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-lg">
            <p className="text-white font-medium">{ref.name}</p>
            <p className="text-sm text-gray-400">{ref.title} at {ref.company}</p>
            <p className="text-sm text-gray-400">{ref.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Step 6: Self Assessment
const SelfAssessmentStep = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Confidence Rating
        </label>
        <p className="text-xs text-gray-400 mb-4">
          How confident are you in your ability to provide accurate investment research?
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">1</span>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.confidenceRating}
            onChange={(e) => updateFormData('confidenceRating', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-400">10</span>
          <span className="text-lg font-semibold text-purple-400 w-8">
            {formData.confidenceRating}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Uncertainty Awareness
        </label>
        <p className="text-xs text-gray-400 mb-4">
          How do you handle questions where you're uncertain about the answer?
        </p>
        <textarea
          value={formData.uncertaintyAwareness}
          onChange={(e) => updateFormData('uncertaintyAwareness', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
          rows="4"
          placeholder="Describe your approach to handling uncertainty in your analysis..."
        />
      </div>

      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-400 mb-3">
          Ready to Start Earning!
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          Once you complete verification, you'll be able to:
        </p>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-400" />
            Answer questions in your areas of expertise
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-400" />
            Earn up to 85% commission on verified answers
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-400" />
            Build your reputation as a trusted expert
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-400" />
            Access higher-value questions as you level up
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ExpertVerificationWizard;
