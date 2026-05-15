
import { BioDataErrors, BioDataForm } from '../types/biostep.types';

export function bioValidation(step: number, data: BioDataForm): BioDataErrors {
  const errors: BioDataErrors = {};
 
  if (step === 1) {
    if (!data.surname.trim()) errors.surname = 'Surname is required';
    if (!data.firstName.trim()) errors.firstName = 'First name is required';
    if (!data.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!data.gender) errors.gender = 'Gender is required';
    if (!data.maritalStatus) errors.maritalStatus = 'Marital status is required';
    if (!data.stateOfOrigin) errors.stateOfOrigin = 'State of origin is required';
    if (!data.lga) errors.lga = 'LGA is required';
    if (!data.nin.trim()) errors.nin = 'NIN is required';
    else if (!/^\d{11}$/.test(data.nin)) errors.nin = 'NIN must be exactly 11 digits';
  }
 
  if (step === 2) {
    if (!data.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email';
    if (!data.phone.trim()) errors.phone = 'Phone number is required';
    if (!data.address.trim()) errors.address = 'Address is required';
    if (!data.guardianName.trim()) errors.nextOfKinName = 'Next of kin name is required';
    if (!data.guardianPhone.trim()) errors.nextOfKinPhone = 'Next of kin phone is required';
    if (!data.guardianRelationship) errors.nextOfKinRelationship = 'Relationship is required';
  }
 
  if (step === 3) {
    if (!data.examType) errors.examType = 'Exam type is required';
    if (!data.examYear) errors.examYear = 'Exam year is required';
    if (!data.examNumber.trim()) errors.examNumber = 'Exam number is required';
    if (!data.centreNumber.trim()) errors.centreNumber = 'Centre number is required';
    if (!data.subjectCategory) errors.subjectCategory = 'Subject category is required';
    const filledSubjects = data.subjects.filter((s) => s.grade);
    if (filledSubjects.length < 5) errors.subjects = 'Enter grades for at least 5 subjects';
  }
 
  if (step === 4) {
    if (!data.faculty) errors.faculty = 'Faculty is required';
    if (!data.department) errors.department = 'Department is required';
    if (!data.programmeType) errors.programmeType = 'Programme type is required';
    if (!data.entryMode) errors.entryMode = 'Entry mode is required';
    if (!data.jambRegNumber.trim()) errors.jambRegNumber = 'Jamb Registration number is required';
    if (!data.jambScore.trim()) errors.jambScore = 'Jamb score is required';
  }
 
  if (step === 5) {
    if (!data.agreedToTerms) errors.agreedToTerms = 'You must agree to the terms';
    if (!data.agreedToAccuracy) errors.agreedToAccuracy = 'You must confirm the accuracy of your information';
    if (!data.signature.trim()) errors.signature = 'Signature is required';
  }
 
  return errors;
}


