angular.module('messages', [])
.constant("ERROR_MESSAGES",
    {
        "GENERIC": "Ocorreu um erro.",
        "MAX_LINES": "Você já selecionou a quantidade máxima de linhas permitida."
    }
)
.constant("SUCCESS_MESSAGES",
    {
        "GENERIC": "Operação realizada com sucesso.",
        "BUS_NOTIFICATION": "Você será notificado quando o ônibus se aproximar.",
    }
)
.constant("CONFIRMATION_MESSAGES",
    {
        "QUIT": "Deseja mesmo sair?",
    }
);
