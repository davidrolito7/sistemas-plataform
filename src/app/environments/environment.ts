export const environment = {
    production: false,
    //* false para producción
    //* true para pruebas y si eres abogado para que no solicituar llave/auth
    DEV_SKIP_2FA: false,
    //* true para producción (abogado no seleciona perfil y empleados si)
    //* false para que abogado tenga que seleccionar perfil
    DEV_SKIP_PERFIL: true,
    ConstantsService: {
        ruta: 'https://pruebas.tribunaloaxaca.gob.mx/permisos',
        idSistema: 4169,
        //ruta : 'https://localhost:7260'
    },

    urlApiEfirma: 'https://pruebas.tribunaloaxaca.gob.mx/efirma/api/efirma',
    urlApiExhortosElectronicos: "https://pruebas.tribunaloaxaca.gob.mx/exhortoselectronicos/api",
    //urlApiAmparosPJF:'https://localhost:44397/Api',
    urlApiAmparosPJF: 'https://pruebas.tribunaloaxaca.gob.mx/amparosApi/api',

    urlApiTerminos: 'https://pruebas.tribunaloaxaca.gob.mx/terminosApi/api',
    //ModuloExhortos:'Exhortos'

    //* api demandas y oficialia primera instancia 0.o
    urlApiJuicioOral: 'http://10.1.10.50:81',
    //urlApiJuicioOral: 'http://127.0.0.1:8000',
    //https://oficialiavirtual.tribunaloaxaca.gob.mx/api,

    //* api juicio oral penal 0.o
    //urlApiJuicioOralPenal: 'https://pruebas.tribunaloaxaca.gob.mx/ApiJuicioOral/api/PromocionesJuicioOral',
    urlApiJuicioOralPenal:'https://localhost:7057/api/PromocionesJuicioOral',

    //* api notificaciones en tiempo real
    // urlApiNotificaciones: 'http://localhost:3000',
    urlApiNotificaciones: 'https://pruebas.tribunaloaxaca.gob.mx/rabbitmq',
};


