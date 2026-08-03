export interface CredentialVO extends BaseEntity {
  credentialId: number | string;
  credentialName: string;
  credentialType: string;
  credentialDataJson: string;
  status: string;
}

export interface CredentialForm {
  credentialId: number | string | undefined;
  credentialName: string;
  credentialType: string;
  credentialDataJson: string;
  status: string;
}

export interface CredentialQuery extends PageQuery {
  credentialName: string;
  credentialType: string;
  status: string;
}
