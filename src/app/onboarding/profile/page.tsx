'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { onboardingService } from '@/services/onboarding.service';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';
import { CompetencyDomainGroup, CompetencyOption } from '@/types/api';
import {
  UserCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  Search,
  Target,
  Sliders,
  Check,
  BrainCircuit,
  Building2,
  Calendar,
  Compass,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

// Predefined Work Areas from official competency framework
const WORK_AREAS = [
  'Statistical Analysis',
  'Data Collection',
  'Survey Operations',
  'Data Management',
  'Economic Statistics',
  'Social Statistics',
  'GIS',
  'IT / Digital Systems',
  'General Administration',
];

// Predefined Learning Goals
const LEARNING_GOALS = [
  'Improve Technical Skills',
  'Learn Data Analysis',
  'Improve Statistical Skills',
  'Learn Python',
  'Learn AI / Machine Learning',
  'Improve Leadership Skills',
  'Career Advancement',
  'Prepare for New Role',
  'Improve Digital Governance Skills',
];

// Predefined Cadres / Domains
const CADRE_OPTIONS = [
  'Subordinate Statistical Service (SSS)',
  'Indian Statistical Service (ISS)',
  'State Statistical Cadre',
  'Data Science & Analytics Cadre',
  'Administrative Cadre',
  'General / External Professional',
];

// Education Qualifications
const EDUCATION_LEVELS = [
  { value: 'BACHELORS', label: 'Bachelors Degree (B.Sc / B.A / B.Tech / Other)' },
  { value: 'MASTERS', label: 'Masters Degree (M.Sc / M.A / M.Tech / MBA)' },
  { value: 'PHD', label: 'Doctorate (Ph.D / Post-Doc)' },
  { value: 'DIPLOMA', label: 'Postgraduate Diploma / Professional Diploma' },
  { value: 'HIGH_SCHOOL', label: 'Higher Secondary / Intermediate' },
  { value: 'OTHER', label: 'Other Professional Qualification' },
];

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { currentUser, role, refreshUser } = useAuth();

  // Wizard Step (1: Profile, 2: Goals, 3: Skills, 4: Self Assessment)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // STEP 1: Professional Profile State
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departmentName, setDepartmentName] = useState('Survey Design and Research Division (SDRD)');
  const [cadre, setCadre] = useState('Subordinate Statistical Service (SSS)');
  const [experienceYears, setExperienceYears] = useState('3.0');
  const [educationLevel, setEducationLevel] = useState('BACHELORS');
  const [currentWorkArea, setCurrentWorkArea] = useState('Statistical Analysis');

  // STEP 2: Professional Goals State
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Improve Technical Skills',
    'Improve Statistical Skills',
  ]);
  const [customGoal, setCustomGoal] = useState('');

  // STEP 3: Select Skills State
  const [competencyDomains, setCompetencyDomains] = useState<CompetencyDomainGroup[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  // STEP 4: Self Assessment State
  interface SkillRating {
    level: number; // 1 to 5
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    experienceYears: number;
  }
  const [skillRatings, setSkillRatings] = useState<Record<string, SkillRating>>({});

  // Submission & Validation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  // Load existing profile & user data on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const user = await authService.getMe();
        if (user) {
          setFullName(user.full_name || '');
          if (user.designation) setDesignation(user.designation);
          if (user.experience_years !== undefined) setExperienceYears(String(user.experience_years));
          if (user.department?.id) setDepartmentId(user.department.id);
          if (user.department?.name) setDepartmentName(user.department.name);
        }
      } catch (err) {
        console.warn('Could not load user details:', err);
      }

      // Try loading existing profile if already created
      try {
        const existingProf = await onboardingService.getProfile();
        if (existingProf) {
          setHasExistingProfile(true);
          if (existingProf.designation) setDesignation(existingProf.designation);
          if (existingProf.department_id) setDepartmentId(existingProf.department_id);
          if (existingProf.department_name) setDepartmentName(existingProf.department_name);
          if (existingProf.experience_years) setExperienceYears(String(existingProf.experience_years));
          if (existingProf.education_level) setEducationLevel(existingProf.education_level);
          if (existingProf.current_work_area) setCurrentWorkArea(existingProf.current_work_area);
          if (existingProf.specialization) setCadre(existingProf.specialization);
        }
      } catch {
        // Normal if profile not yet created
      }

      // Fetch official competencies for Step 3
      setIsLoadingSkills(true);
      try {
        const res = await onboardingService.getAvailableCompetencies();
        if (res.domains && res.domains.length > 0) {
          setCompetencyDomains(res.domains);
          // Default pre-select 2-3 popular competencies
          const defaultIds: string[] = [];
          res.domains.forEach((d) => {
            d.competencies.slice(0, 1).forEach((c) => defaultIds.push(c.id));
          });
          setSelectedSkillIds(defaultIds);

          // Initialize ratings for defaults
          const initRatings: Record<string, SkillRating> = {};
          defaultIds.forEach((id) => {
            initRatings[id] = { level: 3, confidence: 'MEDIUM', experienceYears: 2.0 };
          });
          setSkillRatings(initRatings);
        }
      } catch (err) {
        console.warn('Could not fetch competencies:', err);
      } finally {
        setIsLoadingSkills(false);
      }
    }

    loadInitialData();
  }, []);

  // Map of all competencies keyed by ID for easy lookup
  const allCompetenciesMap = useMemo(() => {
    const map = new Map<string, CompetencyOption & { domain: string }>();
    competencyDomains.forEach((domainGroup) => {
      domainGroup.competencies.forEach((comp) => {
        map.set(comp.id, { ...comp, domain: domainGroup.domain });
      });
    });
    return map;
  }, [competencyDomains]);

  // Filtered competencies based on search
  const filteredDomains = useMemo(() => {
    if (!skillSearch.trim()) return competencyDomains;
    const q = skillSearch.toLowerCase();
    return competencyDomains
      .map((dg) => ({
        ...dg,
        competencies: dg.competencies.filter(
          (c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
        ),
      }))
      .filter((dg) => dg.competencies.length > 0);
  }, [competencyDomains, skillSearch]);

  // Toggle skill selection
  const handleToggleSkill = (comp: CompetencyOption) => {
    setSelectedSkillIds((prev) => {
      const exists = prev.includes(comp.id);
      let updated: string[];
      if (exists) {
        updated = prev.filter((id) => id !== comp.id);
        setSkillRatings((ratings) => {
          const next = { ...ratings };
          delete next[comp.id];
          return next;
        });
      } else {
        updated = [...prev, comp.id];
        setSkillRatings((ratings) => ({
          ...ratings,
          [comp.id]: ratings[comp.id] || { level: 3, confidence: 'MEDIUM', experienceYears: 1.5 },
        }));
      }
      return updated;
    });
  };

  // Toggle goal selection
  const handleToggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  // Navigation handlers
  const handleNextStep = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!designation.trim()) {
        setErrorMessage('Please provide your professional job designation.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedGoals.length === 0 && !customGoal.trim()) {
        setErrorMessage('Please select at least one learning goal or specify a custom goal.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (selectedSkillIds.length === 0) {
        setErrorMessage('Please select at least one skill to assess.');
        return;
      }
      // Ensure all selected skills have rating entries
      setSkillRatings((prev) => {
        const next = { ...prev };
        selectedSkillIds.forEach((id) => {
          if (!next[id]) {
            next[id] = { level: 3, confidence: 'MEDIUM', experienceYears: 2.0 };
          }
        });
        return next;
      });
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  // Final Onboarding Submission
  const handleFinalSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // 1. Save or Update Professional Profile
      setSubmissionStage('Analyzing your professional profile...');
      const combinedBio = [
        selectedGoals.length > 0 ? `Goals: ${selectedGoals.join(', ')}` : '',
        customGoal.trim() ? `Custom Objective: ${customGoal.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const profilePayload = {
        department_id: departmentId || undefined,
        designation: designation.trim() || 'Statistical Officer',
        employment_type: 'GOVERNMENT_OFFICER',
        experience_years: parseFloat(experienceYears) || 0.0,
        education_level: educationLevel,
        specialization: cadre,
        current_work_area: currentWorkArea,
        bio: combinedBio || 'Official statistical profile initialized through onboarding.',
      };

      if (hasExistingProfile) {
        await onboardingService.updateProfile(profilePayload);
      } else {
        await onboardingService.createProfile(profilePayload);
      }

      await new Promise((r) => setTimeout(r, 700));

      // 2. Submit Skill Declarations
      setSubmissionStage('Building your initial competency profile...');
      const declarations = selectedSkillIds.map((id) => {
        const rating = skillRatings[id] || { level: 3, confidence: 'MEDIUM', experienceYears: 1.5 };
        return {
          competency_id: id,
          self_assessed_level: rating.level,
          confidence_level: rating.confidence,
          years_of_experience: rating.experienceYears,
          last_used: 'CURRENTLY_USING',
        };
      });

      if (declarations.length > 0) {
        await onboardingService.declareSkills({ skills: declarations });
      }

      await new Promise((r) => setTimeout(r, 900));

      // 3. Learning Priorities
      setSubmissionStage('Identifying your learning priorities...');
      await new Promise((r) => setTimeout(r, 800));

      // Refresh session user state
      await refreshUser();

      // Redirect to Learner Dashboard
      router.push('/learner/dashboard');
    } catch (err: any) {
      console.error('Onboarding submission failed:', err);
      setIsSubmitting(false);
      setErrorMessage(
        err.detail?.message ||
          err.message ||
          'Failed to finalize competency onboarding. Please verify your connection and try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Navigation Header */}
      <header className="h-16 border-b border-border bg-surface px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-teal flex items-center justify-center font-bold text-white text-sm shadow-sm">
            CQ
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-wider text-text-primary leading-none">
              COMPET<span className="text-teal">IQ</span>
            </span>
            <span className="text-[10px] text-text-muted tracking-tight uppercase font-medium mt-0.5">
              Professional Onboarding Wizard
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="teal" size="sm" withDot className="font-semibold">
            Step {currentStep} of 4
          </Badge>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-xs text-text-muted hover:text-text-primary transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 max-w-4xl mx-auto w-full">
        {/* Progress Bar / Stepper */}
        <div className="w-full mb-8">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold mb-2">
            <span className={currentStep >= 1 ? 'text-primary' : 'text-text-muted'}>
              1. Profile
            </span>
            <span className={currentStep >= 2 ? 'text-primary' : 'text-text-muted'}>
              2. Goals
            </span>
            <span className={currentStep >= 3 ? 'text-primary' : 'text-text-muted'}>
              3. Skills
            </span>
            <span className={currentStep >= 4 ? 'text-primary' : 'text-text-muted'}>
              4. Assessment
            </span>
          </div>
          <div className="h-1.5 w-full bg-border-light rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div className="text-center space-y-1.5 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Build Your Professional Profile
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto">
            Help COMPETIQ understand your professional background to create a personalized competency profile.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="w-full mb-4 p-3.5 bg-critical-light border border-critical/30 rounded-xl text-xs text-critical font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submission Loading Overlay */}
        {isSubmitting ? (
          <Card className="w-full p-12 border-border bg-surface text-center space-y-6 my-auto shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary">{submissionStage}</h3>
              <p className="text-xs text-text-muted">
                Synthesizing conservative baselines and mapping official MoSPI competency benchmarks.
              </p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </Card>
        ) : (
          /* Step Wizard Card */
          <Card className="w-full p-6 sm:p-9 border-border bg-surface rounded-2xl shadow-card space-y-6">
            {/* =========================================================
                STEP 1: PROFESSIONAL DETAILS
               ========================================================= */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-border-light pb-3">
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Step 1: Professional Information
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Enter your official job details to calibrate your benchmark requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Arjun Kumar"
                  />

                  {/* Designation */}
                  <Input
                    label="Professional / Job Role *"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Statistical Investigator"
                    required
                  />

                  {/* Department / Organization */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Department / Division
                    </label>
                    <input
                      type="text"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      placeholder="e.g. Survey Design and Research Division (SDRD)"
                      className="w-full h-9 px-3 text-sm text-text-primary bg-surface border border-border rounded-btn focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>

                  {/* Cadre / Domain */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Cadre / Professional Domain
                    </label>
                    <select
                      value={cadre}
                      onChange={(e) => setCadre(e.target.value)}
                      className="w-full h-9 px-3 text-sm text-text-primary bg-surface border border-border rounded-btn focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    >
                      {CADRE_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Years of Experience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Total Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full h-9 px-3 text-sm text-text-primary bg-surface border border-border rounded-btn focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>

                  {/* Education Qualification */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Education / Qualification
                    </label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full h-9 px-3 text-sm text-text-primary bg-surface border border-border rounded-btn focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    >
                      {EDUCATION_LEVELS.map((edu) => (
                        <option key={edu.value} value={edu.value}>
                          {edu.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Current Work Area */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-text-primary">
                      Current Work Area
                    </label>
                    <select
                      value={currentWorkArea}
                      onChange={(e) => setCurrentWorkArea(e.target.value)}
                      className="w-full h-9 px-3 text-sm text-text-primary bg-surface border border-border rounded-btn focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    >
                      {WORK_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                STEP 2: PROFESSIONAL GOALS
               ========================================================= */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-border-light pb-3">
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Target className="w-4 h-4 text-teal" />
                    Define Your Learning Goal
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Tell COMPETIQ what you want to achieve. Select one or more objectives.
                  </p>
                </div>

                {/* Goals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LEARNING_GOALS.map((goal) => {
                    const isSelected = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => handleToggleGoal(goal)}
                        className={`p-3.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-primary bg-primary-light/40 text-primary ring-1 ring-primary'
                            : 'border-border bg-surface-elevated/40 text-text-primary hover:border-primary/40'
                        }`}
                      >
                        <span>{goal}</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-2 ${
                            isSelected ? 'bg-primary text-white' : 'border border-border text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Goal Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <span>Custom Professional Goal</span>
                    <span className="text-text-muted font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="e.g. Master Small Area Estimation models for national survey rounds"
                    className="w-full h-9 px-3 text-sm text-text-primary bg-surface border border-border rounded-btn focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-text-muted"
                  />
                </div>
              </div>
            )}

            {/* =========================================================
                STEP 3: SELECT YOUR SKILLS
               ========================================================= */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light pb-3">
                  <div>
                    <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-primary" />
                      Tell Us What You Know
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Select the skills you currently have. You will assess your proficiency in the next step.
                    </p>
                  </div>
                  <Badge variant="teal" size="sm" className="font-bold shrink-0">
                    {selectedSkillIds.length} skills selected
                  </Badge>
                </div>

                {/* Skill Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder="Search statistical, technical, or governance competencies..."
                    className="w-full h-9 pl-9 pr-3 text-sm text-text-primary bg-surface border border-border rounded-btn focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                {/* Skills grouped by domain */}
                {isLoadingSkills ? (
                  <div className="py-12 text-center text-xs text-text-muted">
                    Loading official competency catalog...
                  </div>
                ) : filteredDomains.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted">
                    No competencies match your search term.
                  </div>
                ) : (
                  <div className="space-y-5 max-h-[380px] overflow-y-auto pr-1">
                    {filteredDomains.map((dg) => (
                      <div key={dg.domain} className="space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-border-light pb-1">
                          {dg.domain.replace('_', ' ')} SKILLS
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {dg.competencies.map((comp) => {
                            const isSelected = selectedSkillIds.includes(comp.id);
                            return (
                              <button
                                key={comp.id}
                                type="button"
                                onClick={() => handleToggleSkill(comp)}
                                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2 ${
                                  isSelected
                                    ? 'border-primary bg-primary-light/40 text-primary ring-1 ring-primary'
                                    : 'border-border bg-surface hover:border-primary/40 text-text-primary'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="font-bold block truncate">{comp.name}</span>
                                  {comp.description && (
                                    <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                                      {comp.description}
                                    </p>
                                  )}
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                    isSelected
                                      ? 'bg-primary text-white'
                                      : 'border border-border text-transparent'
                                  }`}
                                >
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================
                STEP 4: SELF ASSESSMENT
               ========================================================= */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-border-light pb-3">
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary" />
                    Assess Your Current Skills
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Provide your self-assessed proficiency and experience for each selected skill.
                  </p>
                </div>

                {/* Mandatory Disclaimer Alert */}
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Important</strong>: This self-assessment provides an initial estimate.
                    Your competency profile becomes more accurate through assessments and learning activity.
                  </p>
                </div>

                {/* Skill Ratings List */}
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {selectedSkillIds.map((id) => {
                    const comp = allCompetenciesMap.get(id);
                    const rating = skillRatings[id] || { level: 3, confidence: 'MEDIUM', experienceYears: 2.0 };
                    return (
                      <div
                        key={id}
                        className="p-4 rounded-xl border border-border bg-[#FBFDFE] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-text-primary">
                              {comp?.name || 'Selected Competency'}
                            </h4>
                            <span className="text-[10px] text-text-muted uppercase">
                              {comp?.domain || 'Core Competency'}
                            </span>
                          </div>
                          <Badge variant="teal" size="sm">
                            Level {rating.level}.0
                          </Badge>
                        </div>

                        {/* Proficiency Level (1 to 5) */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-text-secondary font-medium">
                            <span>Proficiency:</span>
                            <span className="font-bold text-primary">
                              {rating.level === 1 && '1 — Beginner (Foundational awareness)'}
                              {rating.level === 2 && '2 — Basic (Supervised application)'}
                              {rating.level === 3 && '3 — Intermediate (Autonomous execution)'}
                              {rating.level === 4 && '4 — Advanced (Complex problem solving)'}
                              {rating.level === 5 && '5 — Expert (Subject matter authority)'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={rating.level}
                            onChange={(e) =>
                              setSkillRatings((prev) => ({
                                ...prev,
                                [id]: { ...rating, level: parseInt(e.target.value, 10) },
                              }))
                            }
                            className="w-full accent-primary cursor-pointer"
                          />
                        </div>

                        {/* Confidence & Years of Experience Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                          <div>
                            <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                              Confidence:
                            </label>
                            <select
                              value={rating.confidence}
                              onChange={(e) =>
                                setSkillRatings((prev) => ({
                                  ...prev,
                                  [id]: { ...rating, confidence: e.target.value as any },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium focus:outline-none focus:border-primary"
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                              Years Experience:
                            </label>
                            <select
                              value={
                                rating.experienceYears <= 1
                                  ? '0-1'
                                  : rating.experienceYears <= 3
                                  ? '1-3'
                                  : rating.experienceYears <= 5
                                  ? '3-5'
                                  : '5+'
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const mappedYears =
                                  val === '0-1' ? 0.5 : val === '1-3' ? 2.0 : val === '3-5' ? 4.0 : 6.0;
                                setSkillRatings((prev) => ({
                                  ...prev,
                                  [id]: { ...rating, experienceYears: mappedYears },
                                }));
                              }}
                              className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium focus:outline-none focus:border-primary"
                            >
                              <option value="0-1">0–1 Years</option>
                              <option value="1-3">1–3 Years</option>
                              <option value="3-5">3–5 Years</option>
                              <option value="5+">5+ Years</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-border-light flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handlePrevStep}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  rightIcon={<Sparkles className="w-4 h-4" />}
                  className="shadow-md shadow-primary/20"
                >
                  Generate My Competency Profile
                </Button>
              )}
            </div>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-border text-center text-xs text-text-muted">
        Ministry of Statistics &amp; Programme Implementation (MoSPI) • NSSTA Cadre Training
      </footer>
    </div>
  );
}
