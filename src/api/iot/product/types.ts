export interface ProductVO {
  id: string | number;
  productCode: string;
  productName: string;
  protocolType: string;
  manufacturer?: string;
  productVersion?: string;
  status?: string;
  description?: string;
  createTime?: string;
}

export interface ProductForm extends BaseEntity {
  id?: string | number;
  productCode?: string;
  productName?: string;
  protocolType?: string;
  manufacturer?: string;
  productVersion?: string;
  status?: string;
  description?: string;
}

export interface ProductQuery extends PageQuery {
  productCode?: string;
  productName?: string;
  protocolType?: string;
  status?: string;
  params?: any;
}
