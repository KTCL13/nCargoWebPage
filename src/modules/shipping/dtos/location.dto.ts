export interface LocationResponseDto {
  id: number;
  name: string;
  type: string; // 'COUNTRY', 'DEPARTMENT', 'CITY'
  zipCode?: string;
  parentId?: number;
}
