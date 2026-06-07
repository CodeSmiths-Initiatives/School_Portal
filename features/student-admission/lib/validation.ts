import type {
	BioData,
	ContactData,
	DeclarationData,
	OLevelData,
	ProgrammeData,
} from "@/features/student-admission/store/studentAdmissionStore";

export type AdmissionErrors = Record<string, string>;

const nameRegex = /^[a-zA-Z\s'-]+$/;
const nigerianPhoneRegex = /^0\d{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPersistedPhotoSource(value: string | null) {
	if (!value) {
		return false;
	}

	return (
		value.startsWith("http://") ||
		value.startsWith("https://") ||
		value.startsWith("/uploads/")
	);
}

export function validateBioData(data: BioData): AdmissionErrors {
	const errors: AdmissionErrors = {};

	if (!isPersistedPhotoSource(data.passportPhoto)) {
		errors.passportPhoto = "Passport photograph is required";
	}

	if (!data.surname.trim()) {
		errors.surname = "Surname is required";
	} else if (!nameRegex.test(data.surname)) {
		errors.surname = "Surname must contain letters only";
	}

	if (!data.firstName.trim()) {
		errors.firstName = "First name is required";
	} else if (!nameRegex.test(data.firstName)) {
		errors.firstName = "First name must contain letters only";
	}

	if (data.otherName && !nameRegex.test(data.otherName)) {
		errors.otherName = "Other name must contain letters only";
	}

	if (!data.dateOfBirth) {
		errors.dateOfBirth = "Date of birth is required";
	} else {
		const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
		if (age < 16) errors.dateOfBirth = "Applicant must be at least 16 years old";
		if (age > 50) errors.dateOfBirth = "Please enter a valid date of birth";
	}

	if (!data.gender) errors.gender = "Gender is required";
	if (!data.maritalStatus) errors.maritalStatus = "Marital status is required";
	if (!data.nationality.trim()) errors.nationality = "Nationality is required";
	if (!data.stateOfOrigin) errors.stateOfOrigin = "State of origin is required";
	if (!data.localGovtArea.trim()) {
		errors.localGovtArea = "Local government area is required";
	}

	if (!data.nin.trim()) {
		errors.nin = "NIN is required";
	} else if (!/^\d{11}$/.test(data.nin)) {
		errors.nin = "NIN must be exactly 11 digits";
	}

	return errors;
}

export function validateContactData(data: ContactData): AdmissionErrors {
	const errors: AdmissionErrors = {};

	if (!data.phoneNumber.trim()) {
		errors.phoneNumber = "Phone number is required";
	} else if (!nigerianPhoneRegex.test(data.phoneNumber)) {
		errors.phoneNumber = "Enter a valid Nigerian mobile number";
	}

	if (data.alternatePhone && !nigerianPhoneRegex.test(data.alternatePhone)) {
		errors.alternatePhone = "Enter a valid Nigerian mobile number";
	}

	if (!data.emailAddress.trim()) {
		errors.emailAddress = "Email address is required";
	} else if (!emailRegex.test(data.emailAddress)) {
		errors.emailAddress = "Enter a valid email address";
	}

	if (!data.confirmEmail.trim()) {
		errors.confirmEmail = "Please confirm your email";
	} else if (data.emailAddress !== data.confirmEmail) {
		errors.confirmEmail = "Email addresses do not match";
	}

	if (!data.residentialAddress.trim()) {
		errors.residentialAddress = "Residential address is required";
	} else if (data.residentialAddress.trim().length < 10) {
		errors.residentialAddress = "Please enter a complete address";
	}

	if (!data.guardianFullName.trim()) {
		errors.guardianFullName = "Guardian name is required";
	}

	if (!data.guardianRelationship) {
		errors.guardianRelationship = "Relationship is required";
	}

	if (!data.guardianPhone.trim()) {
		errors.guardianPhone = "Guardian phone is required";
	} else if (!nigerianPhoneRegex.test(data.guardianPhone)) {
		errors.guardianPhone = "Enter a valid Nigerian mobile number";
	}

	if (data.guardianEmail && !emailRegex.test(data.guardianEmail)) {
		errors.guardianEmail = "Enter a valid email address";
	}

	if (!data.guardianAddress.trim()) {
		errors.guardianAddress = "Guardian address is required";
	}

	return errors;
}

export function validateOLevelData(data: OLevelData): AdmissionErrors {
	const errors: AdmissionErrors = {};

	if (!data.examinationType) errors.examinationType = "Examination type is required";
	if (!data.examinationYear) errors.examinationYear = "Examination year is required";
	if (!data.examinationNumber.trim()) {
		errors.examinationNumber = "Examination number is required";
	}
	if (!data.centreNumber.trim()) errors.centreNumber = "Centre number is required";
	if (!data.subjectCategory) {
		errors.subjectCategory = "Please select a subject category";
	}
	if (data.subjects.filter((subject) => subject.grade).length < 5) {
		errors.subjects = "Please enter grades for at least 5 subjects";
	}

	return errors;
}

export function validateProgrammeData(data: ProgrammeData): AdmissionErrors {
	const errors: AdmissionErrors = {};

	if (!data.faculty) errors.faculty = "Faculty is required";
	if (!data.department) errors.department = "Department is required";
	if (!data.modeOfEntry) errors.modeOfEntry = "Mode of entry is required";
	if (!data.programmeType) errors.programmeType = "Programme type is required";

	if (!data.jambRegNumber.trim()) {
		errors.jambRegNumber = "JAMB registration number is required";
	} else if (!/^\d{11}[A-Z]{2}$/.test(data.jambRegNumber.toUpperCase())) {
		errors.jambRegNumber = "Enter valid JAMB reg number, e.g. 20261234567AB";
	}

	const jambScore = Number(data.jambScore);
	if (!data.jambScore.trim()) {
		errors.jambScore = "JAMB score is required";
	} else if (!Number.isFinite(jambScore) || jambScore < 0 || jambScore > 400) {
		errors.jambScore = "JAMB score must be between 0 and 400";
	}

	if (!data.jambYear) errors.jambYear = "JAMB year is required";
	if (!data.secondChoice) errors.secondChoice = "Second choice programme is required";
	if (!data.secondarySchoolName.trim()) {
		errors.secondarySchoolName = "Secondary school name is required";
	}
	if (!data.yearOfGraduation) {
		errors.yearOfGraduation = "Year of graduation is required";
	}
	if (!data.schoolAddress.trim()) errors.schoolAddress = "School address is required";

	return errors;
}

export function validateDeclarationData(data: DeclarationData): AdmissionErrors {
	const errors: AdmissionErrors = {};

	if (!data.agreed) errors.agreed = "You must agree to the declaration";
	if (!data.signature.trim()) errors.signature = "Signature is required";
	if (!data.date) errors.date = "Date is required";

	return errors;
}
