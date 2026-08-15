export const PRIVACY_NOTICE_VERSION = "2026-08-15";

export const PRIVACY_CONTROLLER = {
  name: "Gabriel Apolo Leal Rocha",
  description: "pessoa física responsável pelo projeto Regularizando",
} as const;

export const PRIVACY_REQUEST_TYPES = ["acesso", "confirmacao_tratamento", "correcao", "exportacao", "eliminacao", "anonimizacao", "oposicao", "duvida"] as const;
export type PrivacyRequestType = (typeof PRIVACY_REQUEST_TYPES)[number];

export const PRIVACY_REQUEST_TYPE_LABELS: Record<PrivacyRequestType, string> = {
  acesso: "Acesso aos dados",
  confirmacao_tratamento: "Confirmação de tratamento",
  correcao: "Correção de dados",
  exportacao: "Exportação de dados",
  eliminacao: "Exclusão de dados",
  anonimizacao: "Anonimização",
  oposicao: "Oposição ao tratamento",
  duvida: "Dúvida sobre privacidade e dados pessoais",
};
