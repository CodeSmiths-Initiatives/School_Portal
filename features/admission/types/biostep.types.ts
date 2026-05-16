export type BioStep = 1 | 2 | 3 | 4 | 5;

export type SubjectCategory = "science" | "arts" | "social";

export interface BioDataForm {
  // Step 1 – Bio Data
  passportPhoto: File | null;
  surname: string;
  firstName: string;
  otherName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  religion: string;
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  nin: string;

  // Step 2 – Contact
  phone: string;
  altPhone: string;
  email: string;
  confirmEmail: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: string;
  guardianEmail: string;
  guardianAddress: string;
  bloodGroup: string;
  genotype: string;
  disability: string;

  // Step 3 – O-Level (first sitting)
  examType: string;
  examYear: string;
  examNumber: string;
  centreNumber: string;
  subjectCategory: SubjectCategory;
  subjects: OLevelSubject[];

  // Step 3 – O-Level (second sitting)
  examType2: string;
  examYear2: string;
  examNumber2: string;
  centreNumber2: string;
  subjects2: OLevelSubject[];

  // Step 4 – Programme
  faculty: string;
  department: string;
  programmeType: string;
  entryMode: string;
  // firstChoice: string;
  // secondChoice: string;
  utmeScore: string;
  utmeYear: string;
  jambRegNumber: string;
  jambScore: string;
  jambYear: string;
  secondChoiceProgramme: string;
  secondarySchoolName: string;
  yearOfGraduation: string;
  schoolAddress: string;
  interestedInCisco: string;

  // Step 5 – Declaration
  agreedToDeclaration: boolean;
  agreedToTerms: boolean;
  agreedToAccuracy: boolean;
  declarationDate: string;
  signature: string;
}

export interface OLevelSubject {
  subject: string;
  grade: string;
  compulsory?: boolean;
}

export type BioDataErrors = Partial<Record<keyof BioDataForm | string, string>>;
