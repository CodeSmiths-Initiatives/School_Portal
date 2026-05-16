"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { BioStep } from "../types/biostep.types";
import { bioValidation } from "../utils/bioValidation";
import { SUBJECT_TRACKS } from "../utils/subjectData";
import type {
  BioDataForm,
  BioDataErrors,
  OLevelSubject,
  SubjectCategory,
} from "../types/biostep.types";
import StepProgressBar from "./StepProgressBar";
import StepHeader from "./StepHeader";
import PersonalInfo from "./PersonalInfo";
import Contact from "./Contact";
import Olevel from "./Olevel";
import ProgrammeStudy from "./ProgrammeStudy";
import Declaration from "./Declaration";

const emptySubjects = (): OLevelSubject[] =>
  Array.from({ length: 9 }, () => ({ subject: "", grade: "" }));

const initialData: BioDataForm = {
  passportPhoto: null,
  surname: "",
  firstName: "",
  otherName: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  religion: "",
  nationality: "Nigerian",
  stateOfOrigin: "kwara",
  lga: "",
  nin: "",

  phone: "",
  altPhone: "",
  email: "",
  confirmEmail: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  guardianName: "",
  guardianRelationship: "",
  guardianPhone: "",
  guardianEmail: "",
  guardianAddress: "",
  bloodGroup: "",
  genotype: "",
  disability: "",

  examType: "",
  examYear: "",
  examNumber: "",
  centreNumber: "",
  subjectCategory: "science",
  subjects: SUBJECT_TRACKS.science.map((s) => ({ ...s })),

  // Step 3 – second sitting
  examType2: "",
  examYear2: "",
  examNumber2: "",
  centreNumber2: "",
  subjects2: emptySubjects(),

  faculty: "",
  department: "",
  programmeType: "",
  entryMode: "",
  utmeScore: "",
  utmeYear: "",
  jambRegNumber: "",
  jambScore: "",
  jambYear: "",
  secondChoiceProgramme: "",
  secondarySchoolName: "",
  yearOfGraduation: "",
  schoolAddress: "",
  interestedInCisco: "",

  agreedToDeclaration: false,
  agreedToTerms: false,
  agreedToAccuracy: false,
  declarationDate: new Date().toISOString().split("T")[0],
  signature: "",
};

export function useBioDataForm() {
  const [currentStep, setCurrentStep] = useState<BioStep>(1);
  const [formData, setFormData] = useState<BioDataForm>(initialData);
  const [errors, setErrors] = useState<BioDataErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  function handleChange(
    field: keyof BioDataForm,
    value: string | boolean | File | null,
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleCategoryChange(category: SubjectCategory) {
    const freshSubjects = SUBJECT_TRACKS[category].map((s) => ({
      ...s,
      grade: "",
    }));
    setFormData((prev) => ({
      ...prev,
      subjectCategory: category,
      subjects: freshSubjects,
    }));
    if (errors.subjectCategory)
      setErrors((prev) => ({ ...prev, subjectCategory: undefined }));
  }

  function handleSubjectChange(
    sittingIndex: 1 | 2,
    rowIndex: number,
    subField: "subject" | "grade",
    value: string,
  ) {
    const key = sittingIndex === 1 ? "subjects" : "subjects2";
    setFormData((prev) => {
      const updated = [...prev[key]];
      updated[rowIndex] = { ...updated[rowIndex], [subField]: value };
      return { ...prev, [key]: updated };
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function goToStep(step: BioStep) {
    if (step < currentStep) setCurrentStep(step);
  }

  async function handleNext() {
    const stepErrors = bioValidation(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as BioStep);
    } else {
      setIsSubmitting(true);
      // TODO: submit to API
      await new Promise((r) => setTimeout(r, 1500));
      setIsSubmitting(false);
      setIsComplete(true);
    }
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as BioStep);
  }
  return {
    currentStep,
    formData,
    errors,
    isSubmitting,
    isComplete,
    handleChange,
    handleCategoryChange,
    handleSubjectChange,
    goToStep,
    handleNext,
    handleBack,
  };
}

export default function BioDataForm() {
  const {
    currentStep,
    formData,
    errors,
    isSubmitting,
    isComplete,
    handleChange,
    handleCategoryChange,
    handleSubjectChange,
    goToStep,
    handleNext,
    handleBack,
  } = useBioDataForm();

  if (isComplete) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-[#b8cce4]/30 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#0d1b3e] mb-2">
          Application Submitted!
        </h2>
        <p className="text-[#6b7e9f] text-sm leading-relaxed max-w-md mx-auto">
          Your application has been received. Please save your reference number
          and check your email for confirmation.
        </p>
        <div className="border border-[#B7770D] bg-black my-3">
          <h3 className="text-lg font-semibold text-[#B7770D] px-5 py-2">
            UOO / 2026 / 6M2R6NO7
          </h3>
        </div>
        <p className="text-[#6b7e9f] text-sm leading-relaxed max-w-md mx-auto">
          You will get a confirmation email within 24 hours. Keep your
          application reference number safe, you will need it to track your
          application.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <StepProgressBar currentStep={currentStep} onStepClick={goToStep} />
      <StepHeader step={currentStep} />

      {/* Form card */}
      <div className="bg-gray-200 rounded-b-2xl shadow-xl shadow-[#b8cce4]/20 overflow-hidden">
        <div className="p-8">
          {currentStep === 1 && (
            <PersonalInfo
              data={formData}
              errors={errors}
              onChange={handleChange}
            />
          )}
          {currentStep === 2 && (
            <Contact
              data={formData}
              errors={errors}
              onChange={(field, value) => handleChange(field, value as string)}
            />
          )}

          {currentStep === 3 && (
            <Olevel
              data={formData}
              errors={errors}
              onChange={(field, value) => handleChange(field, value as string)}
              onCategoryChange={handleCategoryChange}
              onSubjectChange={handleSubjectChange}
            />
          )}
          {currentStep === 4 && (
            <ProgrammeStudy
              data={formData}
              errors={errors}
              onChange={(field, value) => handleChange(field, value as string)}
            />
          )}
          {currentStep === 5 && (
            <Declaration
              data={formData}
              errors={errors}
              onChange={handleChange}
            />
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t border-[#dce6f2] bg-[#8a9ab5  px-8 py-4 flex items-center justify-between">
          <p className="text-sm text-[#8a9ab5] font-medium">
            Step {currentStep} of 5
          </p>
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handleBack}
                className="px-6 py-2.5 rounded-xl border-2 border-[#dce6f2] bg-white
                  text-[#4a5a7a] text-sm font-semibold hover:border-[#3d5a9e] hover:text-[#3d5a9e]
                  transition-all duration-200"
              >
                ← Back
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-xl bg-[#2E86C1] hover:bg-[#2d4a8e]
                text-white text-sm font-semibold tracking-wide
                transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                shadow-md shadow-[#3d5a9e]/30 hover:shadow-lg hover:-translate-y-0.5
                flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Submitting…
                </>
              ) : currentStep === 5 ? (
                "🔒 Submit Application"
              ) : (
                "Continue →"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
