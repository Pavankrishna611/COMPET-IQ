'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import { onboardingService } from '@/services/onboarding.service';
import {
  UserCheck,
  Briefcase,
  Building2,
  GraduationCap,
  Award,
  Target,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';

const DESIGNATIONS = [
  { value: '', label: 'Select designation...' },
  { value: 'Statistical Investigator', label: 'Statistical Investigator' },
  { value: 'Senior Statistical Officer', label: 'Senior Statistical Officer' },
  { value: 'Statistical Officer', label: 'Statistical Officer' },
  { value: 'Data Analyst', label: 'Data Analyst' },
  { value: 'Research Officer', label: 'Research Officer' },
  { value: 'Director / Joint Director', label: 'Director / Joint Director' },
  { value: 'Other', label: 'Other Designation' },
];

const DEPARTMENTS = [
  { value: '', label: 'Select department...' },
  { value: 'Economic Statistics', label: 'Economic Statistics' },
  { value: 'Social Statistics', label: 'Social Statistics' },
  { value: 'Labour Statistics', label: 'Labour Statistics' },
  { value: 'Agriculture Statistics', label: 'Agriculture Statistics' },
  { value: 'National Accounts', label: 'National Accounts' },
  { value: 'Survey Design and Research Division (SDRD)', label: 'Survey Design and Research Division (SDRD)' },
  { value: 'National Statistical Systems Training Academy (NSSTA)', label: 'National Statistical Systems Training Academy (NSSTA)' },
  { value: 'Other Department / Division', label: 'Other Department / Division' },
];

const JOB_ROLES = [
  { value: '', label: 'Select job role...' },
  { value: 'Statistical Investigator', label: 'Statistical Investigator' },
  { value: 'Data Analyst', label: 'Data Analyst' },
  { value: 'Statistical Officer', label: 'Statistical Officer' },
  { value: 'Senior Statistical Officer', label: 'Senior Statistical Officer' },
  { value: 'Research Officer', label: 'Research Officer' },
  { value: 'Data Scientist', label: 'Data Scientist' },
  { value: 'Survey Enumerator / Field Officer', label: 'Survey Enumerator / Field Officer' },
  { value: 'Operations & Quality Analyst', label: 'Operations & Quality Analyst' },
];

const EDUCATION_LEVELS = [
  { value: '', label: 'Select educational qualification...' },
  { value: 'BACHELORS', label: 'Bachelors Degree (B.Sc / B.A / B.Tech / Other)' },
  { value: 'MASTERS', label: 'Masters Degree (M.Sc / M.A / M.Tech / MBA)' },
  { value: 'PHD', label: 'Doctorate (Ph.D / Post-Doc)' },
  { value: 'DIPLOMA', label: 'Postgraduate Diploma / Professional Diploma' },
  { value: 'HIGH_SCHOOL', label: 'Higher Secondary / Intermediate' },
  { value: 'OTHER', label: 'Other Professional Qualification' },
];

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Select total work experience...' },
  { value: 'Fresher', label: 'Fresher' },
  { value: '0–1 years', label: '0–1 years' },
  { value: '1–3 years', label: '1–3 years' },
  { value: '3–5 years', label: '3–5 years' },
  { value: '5+ years', label: '5+ years' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, logout, refreshUser } = useAuth();

  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 10 Form Fields
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [currentAssignment, setCurrentAssignment] = useState('');
  const [education, setEducation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [previousTrainings, setPreviousTrainings] = useState('');
  const [careerGoal, setCareerGoal] = useState('');

  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Check if profile already complete on mount
  useEffect(() => {
    let isMounted = true;
    async function verifyStatus() {
      try {
        const status = await onboardingService.getStatus();
        if (isMounted && status.profile_completed && status.onboarding_completed) {
          router.replace('/learner/dashboard');
          return;
        }

        // Try prefilling existing profile if draft exists
        try {
          const profile = await onboardingService.getProfile();
          if (isMounted && profile) {
            if (profile.designation) setDesignation(profile.designation);
            if (profile.department || profile.department_name) setDepartment(profile.department || profile.department_name || '');
            if (profile.job_role) setJobRole(profile.job_role);
            if (profile.current_assignment) setCurrentAssignment(profile.current_assignment);
            if (profile.education_level) setEducation(profile.education_level);
            if (profile.specialization) setSpecialization(profile.specialization);
            if (profile.previous_trainings) setPreviousTrainings(profile.previous_trainings);
            if (profile.professional_goal || profile.career_goal) setCareerGoal(profile.professional_goal || profile.career_goal || '');
          }
        } catch {
          // No draft profile exists yet
        }
      } catch {
        // Unauthenticated or network issue
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    verifyStatus();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Prefill Full Name from registration / currentUser
  useEffect(() => {
    if (currentUser?.name && !fullName) {
      setFullName(currentUser.name);
    }
  }, [currentUser, fullName]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Validation errors
  const errors = {
    designation: touched.designation && !designation.trim() ? 'Please select or enter your designation.' : undefined,
    department: touched.department && !department.trim() ? 'Please select your department or division.' : undefined,
    jobRole: touched.jobRole && !jobRole.trim() ? 'Please select your functional job role.' : undefined,
    currentAssignment:
      touched.currentAssignment && currentAssignment.trim().length < 5
        ? 'Please describe your current work assignment (minimum 5 characters).'
        : undefined,
    education: touched.education && !education.trim() ? 'Please select your educational qualification.' : undefined,
    experience: touched.experience && !experience.trim() ? 'Please select your total work experience.' : undefined,
    careerGoal:
      touched.careerGoal && careerGoal.trim().length < 5
        ? 'Please describe what you want to achieve through COMPETIQ.'
        : undefined,
  };

  const isFormValid =
    Boolean(designation.trim()) &&
    Boolean(department.trim()) &&
    Boolean(jobRole.trim()) &&
    currentAssignment.trim().length >= 5 &&
    Boolean(education.trim()) &&
    Boolean(experience.trim()) &&
    careerGoal.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setTouched({
      designation: true,
      department: true,
      jobRole: true,
      currentAssignment: true,
      education: true,
      experience: true,
      careerGoal: true,
    });

    if (!isFormValid) {
      setSubmitError('Please complete all required fields before continuing.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onboardingService.saveProfile({
        designation: designation.trim(),
        department: department.trim(),
        job_role: jobRole.trim(),
        current_assignment: currentAssignment.trim(),
        education: education.trim(),
        education_level: education.trim(),
        experience: experience.trim(),
        specialization: specialization.trim() || undefined,
        previous_trainings: previousTrainings.trim() || undefined,
        career_goal: careerGoal.trim(),
        professional_goal: careerGoal.trim(),
        current_work_area: department.trim(),
      });

      await refreshUser();
      // Requirement: Navigate to /onboarding/analysis after submission
      router.push('/onboarding/analysis');
    } catch (err: any) {
      console.error('Failed to save professional profile:', err);
      setSubmitError(
        err.detail?.message ||
        err.detail ||
        err.message ||
        'Failed to save your professional profile. Please check your inputs and try again.'
      );
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="flex items-center gap-3 text-text-secondary text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading onboarding workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-surface px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-navy px-2.5 py-1 rounded-xl shadow-xs flex items-center">
            <Logo size="sm" className="h-7 w-auto" />
          </div>
          <span className="text-[11px] text-text-muted tracking-tight uppercase font-medium border-l border-border pl-3">
            Professional Onboarding
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="teal" size="sm" withDot className="font-semibold">
            Step 1 of 2: Profile
          </Badge>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-text-muted hover:text-text-primary transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Profile Form */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 max-w-3xl mx-auto w-full">
        <Card className="w-full shadow-card border border-border">
          <CardHeader className="p-6 sm:p-8 border-b border-border-light bg-[#FBFDFE]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-btn bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-text-primary">
                  Complete Your Professional Profile
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-text-secondary mt-0.5">
                  Provide your official background details to configure your competency assessment and learning journey.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {submitError && (
                <div className="p-3.5 rounded-btn text-xs font-medium flex items-center gap-2 border bg-critical-light border-critical/30 text-critical">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* SECTION 1: Personal & Role Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5 border-b border-border-light pb-2">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> Role &amp; Official Designation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Full Name (Prefilled) */}
                  <div>
                    <Input
                      label="Full Name"
                      placeholder="e.g. Arjun Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      helperText="Prefilled from your account registration"
                    />
                  </div>

                  {/* 2. Designation (Required) */}
                  <div>
                    <Select
                      label="Designation *"
                      options={DESIGNATIONS}
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      onBlur={() => handleBlur('designation')}
                      error={errors.designation}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 3. Department (Required) */}
                  <div>
                    <Select
                      label="Department *"
                      options={DEPARTMENTS}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      onBlur={() => handleBlur('department')}
                      error={errors.department}
                      required
                    />
                  </div>

                  {/* 4. Job Role (Required) */}
                  <div>
                    <Select
                      label="Job Role *"
                      options={JOB_ROLES}
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      onBlur={() => handleBlur('jobRole')}
                      error={errors.jobRole}
                      required
                    />
                  </div>
                </div>

                {/* 5. Current Assignment (Required) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="currentAssignment" className="text-xs font-semibold text-text-primary">
                    Current Assignment *
                  </label>
                  <textarea
                    id="currentAssignment"
                    rows={2}
                    value={currentAssignment}
                    onChange={(e) => setCurrentAssignment(e.target.value)}
                    onBlur={() => handleBlur('currentAssignment')}
                    placeholder="e.g. Responsible for collecting, cleaning and analysing economic survey data."
                    className={`w-full p-3 text-sm text-text-primary bg-surface border rounded-btn transition-colors placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/15 ${errors.currentAssignment
                        ? 'border-critical focus:border-critical focus:ring-critical/15'
                        : 'border-border focus:border-primary'
                      }`}
                    required
                  />
                  {errors.currentAssignment ? (
                    <p className="text-xs text-critical font-medium">{errors.currentAssignment}</p>
                  ) : (
                    <p className="text-xs text-text-secondary">
                      Briefly describe your active operational or analytical responsibilities.
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION 2: Qualifications & Experience */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5 border-b border-border-light pb-2">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" /> Qualifications &amp; Experience
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 6. Educational Qualification (Required) */}
                  <div>
                    <Select
                      label="Educational Qualification *"
                      options={EDUCATION_LEVELS}
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      onBlur={() => handleBlur('education')}
                      error={errors.education}
                      required
                    />
                  </div>

                  {/* 7. Specialization (Optional) */}
                  <div>
                    <Input
                      label="Specialization"
                      placeholder="e.g. Statistics, Econometrics, Computer Science"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      helperText="Optional academic major or subject area"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 8. Total Work Experience (Required) */}
                  <div>
                    <Select
                      label="Total Work Experience *"
                      options={EXPERIENCE_OPTIONS}
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      onBlur={() => handleBlur('experience')}
                      error={errors.experience}
                      required
                    />
                  </div>

                  {/* 9. Previous Trainings (Optional) */}
                  <div>
                    <Input
                      label="Previous Trainings"
                      placeholder="e.g. NSSTA Official Statistics, Python for Data Science"
                      value={previousTrainings}
                      onChange={(e) => setPreviousTrainings(e.target.value)}
                      helperText="Optional past workshops or certified training programs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Career Goal */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5 border-b border-border-light pb-2">
                  <Target className="w-3.5 h-3.5 text-teal" /> Professional Objectives
                </h3>

                {/* 10. Professional / Career Goal (Required) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="careerGoal" className="text-xs font-semibold text-text-primary">
                    What do you want to achieve through COMPETIQ? *
                  </label>
                  <textarea
                    id="careerGoal"
                    rows={3}
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    onBlur={() => handleBlur('careerGoal')}
                    placeholder="e.g. I want to improve my statistical data analysis skills and become proficient in Python."
                    className={`w-full p-3 text-sm text-text-primary bg-surface border rounded-btn transition-colors placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/15 ${errors.careerGoal
                        ? 'border-critical focus:border-critical focus:ring-critical/15'
                        : 'border-border focus:border-primary'
                      }`}
                    required
                  />
                  {errors.careerGoal ? (
                    <p className="text-xs text-critical font-medium">{errors.careerGoal}</p>
                  ) : (
                    <p className="text-xs text-text-secondary">
                      This informs your personalized learning pathway and recommended competencies.
                    </p>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-text-muted">* Required fields</span>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full sm:w-auto px-8 font-semibold shadow-sm"
                  rightIcon={!isSubmitting && <ArrowRight className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Saving Profile...' : 'Continue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-border-light text-center text-xs text-text-muted">
        Ministry of Statistics &amp; Programme Implementation • Official Statistics Competency Framework
      </footer>
    </div>
  );
}
