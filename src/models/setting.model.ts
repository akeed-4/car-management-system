export interface settingDto {
  label: string;
  content: string;
}

export interface applicationFlagTabDto {
  applicationFlagTabId: string;
  applicationFlagTabName: string;
}

export interface settingTabCardDto {
  applicationFlagHeaderId: number;
  applicationFlagHeaderName: string;
  cardList :SettingTabCardDetailDto[];
}


export interface SettingTabCardDetailDto {
  applicationFlagHeaderId: number;
  applicationFlagDetailId: number;
  applicationFlagTypeId: number;
  flagName: string;
  flagValue: any;
  selectDetail: SettingTabCardDetailSelectDto[]
}
export interface SettingTabCardDetailSelectDto {
  applicationFlagHeaderId: number;
  applicationFlagDetailId: number;
  selectId: number;
  selectName: string;
}

export interface saveApplicationSettingDto {
  companyId: number;
  applicationFlagDetailId: number;
  applicationFlagTypeId: number;
  flagName: string;
  flagValue: string;
  file?:blobFileDto | null;
}
export interface imageBase64Dto{
  imageData:string;
  contentType:string;
}

export interface blobFileDto {
  id: number;
  fileName: string | null;
  content: string | null;
  contentType: string | null;
  createdAt: string;
}

export interface printSettingVm {
  institutionNameAr: string | null;
  institutionNameEn: string | null;
  institutionOtherNameAr: string | null;
  institutionOtherNameEn: string | null;
  address1Ar: string | null;
  address1En: string | null;
  address2Ar: string | null;
  address2En: string | null;
  address3Ar: string | null;
  address3En: string | null;
  topNotesFirstPageOnlyAr: string | null;
  topNotesFirstPageOnlyEn: string | null;
  bottomNotesLastPageOnlyAr: string | null;
  bottomNotesLastPageOnlyEn: string | null;
  topNotesAllPagesAr: string | null;
  topNotesAllPagesEn: string | null;
  bottomNotesAllPagesAr: string | null;
  bottomNotesAllPagesEn: string | null;
  printBusinessName: boolean;
  printDateTime: boolean;
  printUserName: boolean;
  printInstitutionLogo: boolean;
  institutionNameFont: number;
  institutionOtherNameFont: number;
  address1Font: number;
  address2Font: number;
  address3Font: number;
  topNotesFirstPageOnlyFont: number;
  bottomNotesLastPageOnlyFont: number;
  topNotesAllPagesFont: number;
  bottomNotesAllPagesFont: number;
  reportPeriodFont: number;
  reportNameFont: number;
  gridFont: number;
  businessFont: number;
  detailRounding: number;
  sumRounding: number;
  printFormId: number;
  logo: string | null;
  topMargin: number;
  rightMargin: number;
  bottomMargin: number;
  leftMargin: number;
  businessName: string;
  institutionName: string | null;
  institutionOtherName: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  topNotesFirstPageOnly: string | null;
  bottomNotesLastPageOnly: string | null;
  topNotesAllPages: string | null;
  bottomNotesAllPages: string | null;
}
