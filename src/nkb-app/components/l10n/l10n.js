//
define(function(require) {'use strict';
    var npl10n = require('np.l10n/np.l10n');

    return angular.module('app.l10n', [npl10n.name])
        //
        .factory('l10nMessages', [function(){
            return {
                // TODO перенести "системные" ключи в текстовый файл
                xxx: [
                    // Основания аффилированности
                    _tr("AFFILIATE_MEMBER_BOARD_DIRECTORS"),
                    _tr("AFFILIATE_SOLE_EXECUTIVE"),
                    _tr("AFFILIATE_SAME_GROUP"),
                    _tr("AFFILIATE_20_PERCENT"),

                    // Валюты
                    _tr("RUB"),
                    _tr("EUR"),
                    _tr("USD"),
                    _tr("GBP"),

                    // Федеральные законы
                    _tr("FZ_44"),
                    _tr("FZ_223"),

                    // Статусы участника закупки
                    _tr("WIN"),
                    _tr("NOT_ADMITTED")
                ],

                source: {
                    'rosstat':                      _tr("Росстат"),
                    'egrul':                        _tr("ЕГРЮЛ"),
                    'egrul_individual_founder':     _tr("ЕГРЮЛ"),
                    'egrul_individual_executive':   _tr("ЕГРЮЛ"),
                    'eaf':                          _tr("Архив ЕГРЮЛ"),
                    'disclosure':                   _tr("Список аффилированных лиц"),
                    'purchases':                    _tr("Закупки")
                },

                phoneType: {
                    'phone_legal':  _tr("Юридический телефон"),
                    'phone_actual': _tr("Физический телефон"),
                    'fax_legal':    _tr("Юридический факс"),
                    'fax_actual':   _tr("Физический факс")
                },

                dataUpdate: {
                    'UPDATED_TIME': _trc("последняя актуализация", "дата последней актуализации данных")
                },

                node: {
                    legalState: {
                       'LIQUIDATE': _trc("Ликвидировано", "ликвидировано предприятие (организация, компания)")
                    },
                    kinship: {
                        'FATHER':            _tr("отец"),
                        //'LASTNAME':          null,
                        //'MALE_LASTNAME':     null,
                        'FEMALE_LASTNAME':   _tr("супруга"),
                        //'SIBLING':           null,
                        'BROTHER':           _tr("брат"),
                        'SISTER':            _tr("сестра"),
                        //'CHILD':             null,
                        'SON':               _tr("сын"),
                        'DAUGHTER':          _tr("дочь")
                    }
                },

                relation: {
                    'FOUNDER_COMPANY': {
                        label: _trc("учредитель", "учредитель юридическое лицо")
                    },
                    'FOUNDER_INDIVIDUAL': {
                        label: _trc("учредитель", "учредитель физическое лицо")
                    },
                    'HEAD_COMPANY': {
                        label: _trc("головная компания", "головная компания юридического лица")
                    },
                    'EXECUTIVE_COMPANY': {
                        label: _trc("руководитель", "руководитель юридическое лицо")
                    },
                    'EXECUTIVE_INDIVIDUAL': {
                        label: _trc("руководитель", "руководитель физическое лицо")
                    },
                    'AFFILIATED_COMPANY': {
                        label: _tr("аффилированная компания")
                    },
                    'AFFILIATED_INDIVIDUAL': {
                        label: _tr("аффилированное физическое лицо")
                    },
                    'PREDECESSOR_COMPANY': {
                        label: _trc("предшественник", "предшественник юридического лица")
                    },
                    'REGISTER_HOLDER': {
                        label: _trc("реестродержатель", "реестродержатель юридического лица")
                    },
                    'ADDRESS': {
                        label: _trc("адрес", "адрес юридического лица")
                    },
                    'PHONE': {
                        label: _trc("телефон", "телефон юридического лица")
                    },
                    'CUSTOMER_COMPANY': {
                        label: _trc("заказчик", "заказчик закупки юридическое лицо")
                    },
                    'PARTICIPANT_COMPANY': {
                        label: _trc("участие в закупках", "участник закупки юридическое лицо")
                    },
                    'PARTICIPANT_INDIVIDUAL': {
                        label: _trc("участие в закупках", "участник закупки физическое лицо")
                    },
                    'COMMISSION_MEMBER': {
                        label: _trc("член комиссии", "член комиссии закупки")
                    },
                    'EMPLOYEE': {
                        label: _trc("Контактное лицо", "сотрудник юридического лица")
                    },

                    count: {
                        'COMPANY_FOUNDER':                      function(n){return _trnc("учредитель",              n, "и учредители компании, и учредители физические лица - все вместе");},
                        'COMPANY_SUBSIDIARY_COMPANY':           function(n){return _trnc("учреждённая компания",    n, "и дочерние компании, и зависимые компании, и ассоциированные компании - все вместе");},
                        'COMPANY_EXECUTIVE':                    function(n){return _trnc("руководитель",            n, "и управляющие компании, и руководители физические лица - все вместе");},

                        'COMPANY_AFFILIATED_PARENTS':           function(n){return _trnc("аффилированное лицо",     n, "и аффилированные компании, и аффилированные физические лица - все вместе");},
                        'COMPANY_AFFILIATED_CHILDREN':          function(n){return _trnc("зависимая компания",      n, "компании, аффилированные с юридическим лицом");},

                        'COMPANY_HEAD_COMPANY':                 function(n){return _trn( "головная компания",       n);},
                        'COMPANY_BRANCH_COMPANY':               function(n){return _trn( "филиал",                  n);},
                        'COMPANY_LEAD_COMPANY':                 function(n){return _trnc("руководимая компания",    n, "компании, руководимые юридическим лицом");},
                        'COMPANY_PREDECESSOR_COMPANY':          function(n){return _trn( "предшественник",          n);},
                        'COMPANY_SUCCESSOR_COMPANY':            function(n){return _trn( "правоприемник",           n);},
                        'COMPANY_REGISTER_HOLDER_COMPANY':      function(n){return _trn( "реестродержатель",        n);},
                        'COMPANY_REGISTERED_HOLDER_COMPANY':    function(n){return _trn( "эмитент",                 n);},
                        'COMPANY_CONTACTS_ADDRESS':             function(n){return _trnc("адрес",                   n, "контактная информация (адреса, телефоны)");},
                        'COMPANY_CONTACTS_PHONE':               function(n){return _trnc("телефон",                 n, "контактная информация (адреса, телефоны)");},
                        'COMPANY_CUSTOMER_CHILDREN':            function(n){return _trnc("закупка",                 n, "заказчик закупки юридическое лицо");},
                        'COMPANY_PARTICIPANT_CHILDREN':         function(n){return _trnc("участие в закупках",      n, "участник закупки юридическое лицо");},
                        'COMPANY_EMPLOYEE_PARENTS':             function(n){return _trnc("контактное лицо",         n, "сотрудник юридического лица");},

                        'INDIVIDUAL_SUBSIDIARY_COMPANY':        function(n){return _trnc("учреждённая компания",    n, "компании, учреждённые физическим лицом");},
                        'INDIVIDUAL_LEAD_COMPANY':              function(n){return _trnc("руководимая компания",    n, "компании, руководимые физическим лицом");},
                        'INDIVIDUAL_AFFILIATED_CHILDREN':       function(n){return _trnc("зависимая компания",      n, "компании, аффилированные с физическим лицом");},
                        'INDIVIDUAL_PARTICIPANT_CHILDREN':      function(n){return _trnc("участие в закупках",      n, "участник закупки физическое лицо");},
                        'INDIVIDUAL_COMMISSION_MEMBER_CHILDREN':function(n){return _trnc("закупочная комиссия",     n, "член комиссии закупки");},
                        'INDIVIDUAL_EMPLOYEE_CHILDREN':         function(n){return _trn("организатор закупки",      n);},

                        'ADDRESS_COMPANY':                      function(n){return _trn("компания", n);},
                        'PHONE_COMPANY':                        function(n){return _trn("компания", n);},

                        'PURCHASE_PARTICIPANT_PARENTS':         function(n){return _trnc("участник",                 n, "и участники закупки компании, и участники закупки физические лица - все вместе");},
                        'PURCHASE_COMMISSION_MEMBER_PARENTS':   function(n){return _trnc("член комиссии",            n, "член комиссии закупки");},
                        'PURCHASE_CUSTOMER_PARENTS':            function(n){return _trnc("заказчик",                 n, "заказчик закупки юридическое лицо");}
                    },

                    'X_ON_REPORT':      _trc("в отчёте", "количество объектов в отчёте: [123 в отчёте], [все в отчёте]"),
                    'ADD':              _trc("добавить", "добавить в отчёт"),
                    'ON_REPORT':        _trc("в отчёт", "добавить в отчёт"),
                    'ADD_ON_REPORT':    _tr( "добавить в отчёт"),
                    'X_MORE':           _trc("ещё", "[ещё 1], [ещё 123]"),

                    'NOT_RELEVANT': _trc("Информация не актуальна", "информация о связи двух объектов не актуальна")
                },

                report: {
                    'new.name':         _tr("Новый отчёт"),
                    'copy.name.suffix': ' — ' + _trc("копия", "копия отчёта"),
                    'export.image':     _trc("Изображение", "Формат экспорта отчёта"),
                    'export.pdf':       _trc("PDF", "Формат экспорта отчёта"),
                    'export.word':      _trc("Word", "Формат экспорта отчёта")
                },

                app: {
                    'title':    _tr("Анализ связей"),
                    'busy':     _tr("Подождите"),
                    'unload':   _tr("Текущий сеанс работы с приложением будет завершён")
                }
            };
        }]);
    //
});
