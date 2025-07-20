const observablePatternCategories = {
  TRAFFIC: {
    name: 'Traffic & Movement Patterns',
    subcategories: [
      {
        id: 'parking_occupancy',
        name: 'Parking Lot Occupancy',
        description: 'Observe parking lot fill rates at different times',
        questions: [
          'What percentage of parking spots are typically filled?',
          'What time do employees typically arrive/leave?',
          'Are there specific days with higher/lower occupancy?'
        ],
        impactLevel: 'MEDIUM'
      },
      {
        id: 'delivery_frequency',
        name: 'Delivery Truck Activity',
        description: 'Track frequency and types of delivery vehicles',
        questions: [
          'How many delivery trucks visit daily?',
          'Which carriers are most common?',
          'What times are deliveries typically made?'
        ],
        impactLevel: 'HIGH'
      },
      {
        id: 'employee_patterns',
        name: 'Employee Movement Patterns',
        description: 'Observe employee arrival, departure, and break patterns',
        questions: [
          'Do you see shift changes? At what times?',
          'Are employees working overtime/weekends?',
          'How many employees enter/exit during typical hours?'
        ],
        impactLevel: 'HIGH'
      },
      {
        id: 'visitor_traffic',
        name: 'Visitor Traffic Analysis',
        description: 'Track visitor patterns and types',
        questions: [
          'What\'s the ratio of suits vs uniforms entering?',
          'Are there more/fewer client visits recently?',
          'Do you see job candidates visiting?'
        ],
        impactLevel: 'MEDIUM'
      },
      {
        id: 'overtime_activity',
        name: 'Overtime & Weekend Activity',
        description: 'Monitor activity outside normal business hours',
        questions: [
          'Are lights on late or on weekends?',
          'Do you see cars in parking lot after hours?',
          'Is there weekend truck/delivery activity?'
        ],
        impactLevel: 'HIGH'
      },
      {
        id: 'security_changes',
        name: 'Security Presence Changes',
        description: 'Notice changes in security staffing or procedures',
        questions: [
          'Has security presence increased/decreased?',
          'Are there new security checkpoints?',
          'Have badge/access procedures changed?'
        ],
        impactLevel: 'MEDIUM'
      }
    ]
  },
 FACILITY: {
   name: 'Facility & Operations Indicators',
   subcategories: [
     {
       id: 'equipment_changes',
       name: 'Equipment Installation/Removal',
       description: 'Track new equipment or removal of existing machinery',
       questions: [
         'Have you seen new equipment being delivered?',
         'Is old equipment being removed or scrapped?',
         'Are there contractors installing new systems?'
       ],
       impactLevel: 'CRITICAL'
     },
     {
       id: 'construction',
       name: 'Construction & Expansion',
       description: 'Monitor facility expansion or renovation',
       questions: [
         'Is there construction activity on site?',
         'Are they expanding the building/warehouse?',
         'Do you see permits posted for construction?'
       ],
       impactLevel: 'CRITICAL'
     },
     {
       id: 'warehouse_capacity',
       name: 'Warehouse Capacity Utilization',
       description: 'Observe how full warehouses and storage areas appear',
       questions: [
         'Do loading docks appear busy or idle?',
         'Can you see inventory levels through windows?',
         'Are outdoor storage areas full or empty?'
       ],
       impactLevel: 'HIGH'
     },
     {
       id: 'loading_activity',
       name: 'Loading Dock Activity',
       description: 'Monitor frequency and volume of loading/unloading',
       questions: [
         'How many trucks at loading docks simultaneously?',
         'How long do trucks typically stay?',
         'Are shipments going out faster/slower than usual?'
       ],
       impactLevel: 'HIGH'
     },
     {
       id: 'waste_patterns',
       name: 'Waste & Recycling Volume',
       description: 'Track waste disposal patterns and volumes',
       questions: [
         'How full are dumpsters typically?',
         'How often is waste picked up?',
         'Do you see unusual disposal activity?'
       ],
       impactLevel: 'MEDIUM'
     },
     {
       id: 'energy_usage',
       name: 'Energy Usage Indicators',
       description: 'Observe signs of energy consumption',
       questions: [
         'Are all building lights typically on?',
         'Do you hear HVAC systems running constantly?',
         'Have they installed solar panels or generators?'
       ],
       impactLevel: 'MEDIUM'
     }
   ]
 },
 SUPPLY_CHAIN: {
   name: 'Supply Chain Signals',
   subcategories: [
     {
       id: 'shipping_destinations',
       name: 'Shipping Label Observations',
       description: 'Notice destinations on packages and shipments',
       questions: [
         'What destinations do you see on shipping labels?',
         'Are there new international destinations?',
         'Has the mix of destinations changed?'
       ],
       impactLevel: 'HIGH'
     },
     {
       id: 'carrier_changes',
       name: 'Logistics Provider Changes',
       description: 'Track which shipping companies are being used',
       questions: [
         'Which carriers do you see most often?',
         'Have they switched primary carriers?',
         'Are they using more expedited shipping?'
       ],
       impactLevel: 'MEDIUM'
     },
     {
       id: 'package_volume',
       name: 'Package Volume Fluctuations',
       description: 'Monitor changes in shipping/receiving volume',
       questions: [
         'Has outbound package volume increased/decreased?',
         'Are more pallets or individual packages being shipped?',
         'Do you see seasonal patterns in volume?'
       ],
       impactLevel: 'HIGH'
     },
     {
       id: 'material_patterns',
       name: 'Raw Material Deliveries',
       description: 'Observe types and frequency of materials delivered',
       questions: [
         'What types of materials are delivered?',
         'Have delivery frequencies changed?',
         'Are there new suppliers delivering?'
       ],
       impactLevel: 'HIGH'
     },
     {
       id: 'shipment_timing',
       name: 'Shipping Schedule Changes',
       description: 'Notice changes in when shipments arrive/leave',
       questions: [
         'Have pickup/delivery times shifted?',
         'Are there rush shipments happening?',
         'Do you see weekend shipping activity?'
       ],
       impactLevel: 'MEDIUM'
     },
     {
       id: 'international_shipping',
       name: 'International Shipping Activity',
       description: 'Track customs forms and international carriers',
       questions: [
         'Do you see customs paperwork?',
         'Are international carriers visiting?',
         'Has international shipping increased/decreased?'
       ],
       impactLevel: 'HIGH'
     }
   ]
 },
 WORKFORCE: {
   name: 'Workforce Dynamics',
   subcategories: [
     {
       id: 'hiring_activity',
       name: 'Hiring Signs & Duration',
       description: 'Monitor "Now Hiring" signs and recruitment activity',
       questions: [
         'How long have hiring signs been up?',
         'What positions are they advertising?',
         'Do you see groups of new employees training?'
       ],
       impactLevel: 'HIGH'
     },
     {
       id: 'contractor_ratio',
       name: 'Contractor vs Employee Mix',
       description: 'Observe the ratio of contractors to regular employees',
       questions: [
         'Do you see more contractor vehicles/uniforms?',
         'Are there temporary staffing agency vans?',
         'Has the mix of badges/uniforms changed?'
       ],
       impactLevel: 'MEDIUM'
     },
     {
       id: 'training_sizes',
       name: 'Training Class Observations',
       description: 'Notice size and frequency of training groups',
       questions: [
         'How large are new employee training groups?',
         'How often do you see training sessions?',
         'Are they training on new equipment/processes?'
       ],
       impactLevel: 'MEDIUM'
     },
     {
       id: 'uniform_changes',
       name: 'Uniform & Badge Updates',
       description: 'Track changes in employee uniforms or badges',
       questions: [
         'Have uniform colors or styles changed?',
         'Do you see new badge types or colors?',
         'Are there new safety equipment requirements?'
       ],
       impactLevel: 'LOW'
     },
     {
       id: 'vehicle_types',
       name: 'Employee Vehicle Analysis',
       description: 'Observe types of vehicles in employee parking',
       questions: [
         'What\'s the mix of luxury vs economy vehicles?',
         'Have employee vehicle types changed?',
         'Do you see more carpooling or ride-sharing?'
       ],
       impactLevel: 'LOW'
     },
     {
       id: 'catering_frequency',
       name: 'Food Service Activity',
       description: 'Monitor food trucks and catering deliveries',
       questions: [
         'How often do food trucks visit?',
         'Is there increased catering for meetings?',
         'Have employee meal services changed?'
       ],
       impactLevel: 'LOW'
     }
   ]
 },
 FINANCIAL: {
   name: 'Financial Health Indicators',
   subcategories: [
     {
       id: 'payment_timing',
       name: 'Vendor Payment Patterns',
       description: 'Notice if vendors mention payment delays',
       questions: [
         'Do vendors mention payment delays?',
         'Are COD deliveries increasing?',
         'Do you hear about credit holds?'
       ],
       impactLevel: 'CRITICAL'
     },
     {
       id: 'collection_activity',
       name: 'Collection Agency Presence',
       description: 'Observe visits from collection agencies',
       questions: [
         'Have you seen collection agency vehicles?',
         'Are there repo trucks on site?',
         'Do you see asset tags on equipment?'
       ],
       impactLevel: 'CRITICAL'
     },
     {
       id: 'equipment_returns',
       name: 'Equipment Repo & Returns',
       description: 'Track equipment being repossessed or returned',
       questions: [
         'Is leased equipment being removed?',
         'Do you see rental equipment returns?',
         'Are company vehicles being returned?'
       ],
       impactLevel: 'CRITICAL'
     },
     {
       id: 'maintenance_signs',
       name: 'Deferred Maintenance Signs',
       description: 'Notice if maintenance appears to be delayed',
       questions: [
         'Does the facility look less maintained?',
         'Are repairs being postponed?',
         'Is landscaping being neglected?'
       ],
       impactLevel: 'MEDIUM'
     },
     {
       id: 'supply_changes',
       name: 'Office Supply Deliveries',
       description: 'Monitor changes in routine supply deliveries',
       questions: [
         'Have office supply deliveries decreased?',
         'Are they switching to cheaper suppliers?',
         'Do you see bulk buying to save costs?'
       ],
       impactLevel: 'LOW'
     },
     {
       id: 'event_frequency',
       name: 'Company Event Activity',
       description: 'Track frequency of company events and meetings',
       questions: [
         'Are there fewer company events?',
         'Have holiday parties been cancelled?',
         'Do you see less catering for meetings?'
       ],
       impactLevel: 'LOW'
     }
   ]
 },

 TECHNOLOGY: {
   name: 'Technology & Systems',
   subcategories: [
     {
       id: 'infrastructure_changes',
       name: 'IT Infrastructure Updates',
       description: 'Notice technology equipment changes',
       questions: [
         'Do you see server equipment deliveries?',
         'Are they installing new network infrastructure?',
         'Have you noticed data center activity?'
       ],
       impactLevel: 'HIGH'
     },
     {
       id: 'software_rollouts',
       name: 'Software Implementation Signs',
       description: 'Observe training or implementation activities',
       questions: [
         'Do you see software vendor vehicles?',
         'Are employees attending system training?',
         'Have computer deliveries increased?'
       ],
       impactLevel: 'MEDIUM'
     },
     {
       id: 'system_downtime',
       name: 'System Downtime Patterns',
       description: 'Notice if operations are affected by outages',
       questions: [
         'Do operations stop at unusual times?',
         'Are there more IT support visits?',
         'Do employees mention system issues?'
       ],
       impactLevel: 'HIGH'
     },
     {
       id: 'security_updates',
       name: 'Cybersecurity Changes',
       description: 'Observe changes in digital security measures',
       questions: [
         'Have badge readers been upgraded?',
         'Are there new camera installations?',
         'Do you see cybersecurity vendor visits?'
       ],
       impactLevel: 'MEDIUM'
     },
     {
       id: 'device_deployments',
       name: 'Device Rollouts',
       description: 'Track deployment of new devices to employees',
       questions: [
         'Are employees getting new laptops/phones?',
         'Do you see tablet deployments?',
         'Are old devices being collected?'
       ],
       impactLevel: 'MEDIUM'
     },
     {
       id: 'cloud_migration',
       name: 'Cloud Migration Indicators',
       description: 'Notice signs of moving to cloud services',
       questions: [
         'Is on-premise equipment being removed?',
         'Do you see cloud vendor materials?',
         'Are there infrastructure reduction signs?'
       ],
       impactLevel: 'HIGH'
     }
   ]
 }
};

// Helper function to get all subcategories for dropdown menus
const getAllSubcategories = () => {
 const subcategories = [];
 
 Object.entries(observablePatternCategories).forEach(([categoryKey, category]) => {
   category.subcategories.forEach(sub => {
     subcategories.push({
       value: `${categoryKey}:${sub.id}`,
       label: sub.name,
       category: category.name,
       categoryKey: categoryKey,
       subcategoryId: sub.id,
       description: sub.description,
       impactLevel: sub.impactLevel
     });
   });
 });
 
 return subcategories;
};

// Helper function to validate pattern input
const validatePatternInput = (patternType, subCategory) => {
 if (!observablePatternCategories[patternType]) {
   return { valid: false, error: 'Invalid pattern type' };
 }
 
 const category = observablePatternCategories[patternType];
 const subcategoryExists = category.subcategories.some(sub => sub.id === subCategory);
 
 if (!subcategoryExists) {
   return { valid: false, error: 'Invalid subcategory for pattern type' };
 }
 
 return { valid: true };
};

// Helper to get suggested questions for a pattern
const getSuggestedQuestions = (patternType, subCategory) => {
 const category = observablePatternCategories[patternType];
 if (!category) return [];
 
 const sub = category.subcategories.find(s => s.id === subCategory);
 return sub ? sub.questions : [];
};

// Export for use in other modules
module.exports = {
 observablePatternCategories,
 getAllSubcategories,
 validatePatternInput,
 getSuggestedQuestions
};
