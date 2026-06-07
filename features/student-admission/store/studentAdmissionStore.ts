"use client";

import { create } from "zustand";

export type BioData = {
	passportPhoto: string | null;
	surname: string;
	firstName: string;
	otherName: string;
	dateOfBirth: string;
	gender: string;
	maritalStatus: string;
	religion: string;
	nationality: string;
	stateOfOrigin: string;
	localGovtArea: string;
	nin: string;
};

export type ContactData = {
	phoneNumber: string;
	alternatePhone: string;
	emailAddress: string;
	confirmEmail: string;
	residentialAddress: string;
	guardianFullName: string;
	guardianRelationship: string;
	guardianPhone: string;
	guardianEmail: string;
	guardianAddress: string;
	bloodGroup: string;
	genotype: string;
	disability: string;
};

export type OLevelSubject = {
	name: string;
	grade: string;
};

export type OLevelData = {
	examinationType: string;
	examinationYear: string;
	examinationNumber: string;
	centreNumber: string;
	subjectCategory: string;
	subjects: OLevelSubject[];
};

export type ProgrammeData = {
	faculty: string;
	department: string;
	modeOfEntry: string;
	programmeType: string;
	jambRegNumber: string;
	jambScore: string;
	jambYear: string;
	secondChoice: string;
	secondarySchoolName: string;
	yearOfGraduation: string;
	schoolAddress: string;
	ciscoInterest: string;
};

export type DeclarationData = {
	agreed: boolean;
	signature: string;
	date: string;
};

type StudentAdmissionState = {
	currentStep: number;
	bioData: BioData;
	contactData: ContactData;
	oLevelData: OLevelData;
	programmeData: ProgrammeData;
	declarationData: DeclarationData;
	setStep: (step: number) => void;
	updateBioData: (data: Partial<BioData>) => void;
	updateContactData: (data: Partial<ContactData>) => void;
	updateOLevelData: (data: Partial<OLevelData>) => void;
	updateProgrammeData: (data: Partial<ProgrammeData>) => void;
	updateDeclarationData: (data: Partial<DeclarationData>) => void;
	hydrateAdmission: (data: {
		currentStep?: number;
		bioData?: Partial<BioData>;
		contactData?: Partial<ContactData>;
		oLevelData?: Partial<OLevelData>;
		programmeData?: Partial<ProgrammeData>;
		declarationData?: Partial<DeclarationData>;
	}) => void;
	resetAdmission: () => void;
};

const initialBioData: BioData = {
	passportPhoto: null,
	surname: "",
	firstName: "",
	otherName: "",
	dateOfBirth: "",
	gender: "",
	maritalStatus: "",
	religion: "",
	nationality: "Nigerian",
	stateOfOrigin: "",
	localGovtArea: "",
	nin: "",
};

const initialContactData: ContactData = {
	phoneNumber: "",
	alternatePhone: "",
	emailAddress: "",
	confirmEmail: "",
	residentialAddress: "",
	guardianFullName: "",
	guardianRelationship: "",
	guardianPhone: "",
	guardianEmail: "",
	guardianAddress: "",
	bloodGroup: "",
	genotype: "",
	disability: "",
};

const initialOLevelData: OLevelData = {
	examinationType: "",
	examinationYear: "",
	examinationNumber: "",
	centreNumber: "",
	subjectCategory: "",
	subjects: [],
};

const initialProgrammeData: ProgrammeData = {
	faculty: "",
	department: "",
	modeOfEntry: "",
	programmeType: "",
	jambRegNumber: "",
	jambScore: "",
	jambYear: "",
	secondChoice: "",
	secondarySchoolName: "",
	yearOfGraduation: "",
	schoolAddress: "",
	ciscoInterest: "",
};

const initialDeclarationData: DeclarationData = {
	agreed: false,
	signature: "",
	date: "",
};

export const useStudentAdmissionStore = create<StudentAdmissionState>((set) => ({
	currentStep: 1,
	bioData: initialBioData,
	contactData: initialContactData,
	oLevelData: initialOLevelData,
	programmeData: initialProgrammeData,
	declarationData: initialDeclarationData,
	setStep: (step) => set({ currentStep: step }),
	updateBioData: (data) =>
		set((state) => ({ bioData: { ...state.bioData, ...data } })),
	updateContactData: (data) =>
		set((state) => ({ contactData: { ...state.contactData, ...data } })),
	updateOLevelData: (data) =>
		set((state) => ({ oLevelData: { ...state.oLevelData, ...data } })),
	updateProgrammeData: (data) =>
		set((state) => ({
			programmeData: { ...state.programmeData, ...data },
		})),
	updateDeclarationData: (data) =>
		set((state) => ({
			declarationData: { ...state.declarationData, ...data },
		})),
	hydrateAdmission: (data) =>
		set((state) => ({
			currentStep: data.currentStep ?? state.currentStep,
			bioData: { ...state.bioData, ...data.bioData },
			contactData: { ...state.contactData, ...data.contactData },
			oLevelData: { ...state.oLevelData, ...data.oLevelData },
			programmeData: { ...state.programmeData, ...data.programmeData },
			declarationData: { ...state.declarationData, ...data.declarationData },
		})),
	resetAdmission: () =>
		set({
			currentStep: 1,
			bioData: initialBioData,
			contactData: initialContactData,
			oLevelData: initialOLevelData,
			programmeData: initialProgrammeData,
			declarationData: initialDeclarationData,
		}),
}));
