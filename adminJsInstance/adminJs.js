import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import argon2 from 'argon2';
import passwordsFeature from '@adminjs/passwords';
import { Adapter, Database, Resource } from '@adminjs/sql';
import { Components, componentLoader } from '../components/index.js';

// SQL Adapter registration
AdminJS.registerAdapter({ Database, Resource });

// SQL Config (or import from a config file)
const SQL_CONFIG = {
    host: '127.0.0.1',
    port: 3306,
    user: 'dbuser',
    password: 'D@T@B@s3',
    database: 'TMIDB',
};

export const setupAdmin = async () => {
    const db = await new Adapter('mysql2', SQL_CONFIG).init();

    const admin = new AdminJS({
        resources: [
            // {
            //     resource: db.table('users'),
            //     options: {
            //         navigation: { name: 'Management', icon: 'User' },
            //         actions: {
            //             new: { isAccessible: true },
            //             edit: { isAccessible: true },
            //             delete: { isAccessible: true },
            //             show: { isAccessible: true },
            //             list: { isAccessible: true },
            //         },
            //         properties: {
            //             id: { isId: true },
            //             user: {
            //                 isVisible: { list: true, edit: false, filter: false, show: false },
            //                 components: {
            //                     list: Components.AvatarList,
            //                 },
            //             },
            //             avatar: {
            //                 type: 'file',
            //                 isVisible: { list: false, edit: true, filter: false, show: true },
            //                 components: {
            //                     edit: Components.AvatarEdit,
            //                     show: Components.AvatarShow,
            //                 },
            //             },
            //             destination_id: {
            //                 type: 'reference',
            //                 reference: 'destinations',
            //                 // array 
            //                 isArray: true,
            //                 isVisible: { list: true, edit: true, filter: false, show: true },
            //             },
            //             created_at: {
            //                 isVisible: { list: true, edit: false, filter: false, show: true },
            //             },
            //             updated_at: {
            //                 isVisible: { list: true, edit: false, filter: false, show: true },
            //             },
            //         },
            //     },
            //     features: [
            //         passwordsFeature({
            //             componentLoader,
            //             properties: {
            //                 encryptedPassword: 'password',
            //                 password: 'password',
            //             },
            //             hash: argon2.hash,
            //         }),
            //     ],
            // },
            // {
            //     resource: db.table('destinations'),
            //     options: {
            //         id: 'destinations',
            //         navigation: { name: 'Management', icon: 'Map' },
            //         properties: {
            //             created_at: {
            //                 isVisible: { list: true, edit: false, filter: false, show: true },
            //             },
            //             updated_at: {
            //                 isVisible: { list: true, edit: false, filter: false, show: true },
            //             },
            //             image: {
            //                 type: 'file',
            //                 components: {
            //                     edit: Components.ImageUploadComponent,
            //                     list: Components.ImageShowComponent,
            //                     show: Components.ImageShowComponent,
            //                 },
            //             },
            //             description: {
            //                 components: {
            //                     edit: Components.RichTextEditorComponent,
            //                     show: Components.RichTextEditorComponent,
            //                 },
            //             }
            //         }
            //     }
            // },
            // {
            //     resource: db.table('content'),
            //     options: {
            //         navigation: { name: 'Management', icon: 'Book' },
            //         properties: {
            //             created_at: {
            //                 isVisible: { list: true, edit: false, filter: false, show: true },
            //             },
            //             updated_at: {
            //                 isVisible: { list: true, edit: false, filter: false, show: true },
            //             },
            //             content: {
            //                 // type: 'richtext',
            //                 components: {
            //                     edit: Components.RichTextEditorComponent,
            //                     show: Components.RichTextEditorShow,
            //                     list: Components.RichTextEditorList,
            //                 },
            //             },
            //         }
            //     }
            // },
            // {
            //     resource: db.table('contentStates'),
            //     options: {
            //         navigation: { name: 'Management', icon: 'Book' },
            //         // actions: {
            //         //     new: {
            //         //         component: Components.ContentStateNew,
            //         //     },
            //         // },
            //         properties: {
            //             created_at: {
            //                 isVisible: { list: true, edit: false, filter: false, show: true },
            //             },
            //             updated_at: {
            //                 isVisible: { list: true, edit: false, filter: false, show: true },
            //             },
            //             content_id: {},
            //             state_id: {}
            //         }
            //     }
            // },
            {
                resource: db.table('region'),
                options: {
                    navigation: { name: 'Location Management', icon: 'Map' },
                    properties: {
                        name: {
                            isTitle: true,
                            isSearchable: true,
                            isVisible: { list: true, show: true, edit: true, filter: true },
                        },
                        description: {
                            components: {
                                list: Components.RichTextEditorList,
                                show: Components.LargeTextShow,
                            },
                        },
                        image: {
                            type: 'file',
                            components: {
                                edit: Components.ImageUploadComponent,
                                list: Components.ImageShowComponent,
                                show: Components.ImageShowComponent,
                            },
                        },
                        content: {
                            components: {
                                edit: Components.RichTextEditorComponent,
                                show: Components.RichTextEditorShow,
                                list: Components.RichTextEditorList,
                            },
                        },
                        created_at: {
                            isVisible: { list: true, edit: false, filter: false, show: true },
                        },
                        updated_at: {
                            isVisible: { list: true, edit: false, filter: false, show: true },
                        },
                    },
                    actions: {
                        new: {
                            after: async (response, request, context) => {
                                console.log('New region created:', context.record?.params); // renamed from "city" to "region"
                                return response;
                            },
                        },
                        edit: {
                            after: async (response, request, context) => {
                                console.log('Region updated:', context.record?.params); // renamed from "city" to "region"
                                return response;
                            },
                        },
                        list: {
                            component: Components.ListComponent,
                            showFilter: true,
                            filterProperties: ['name'],
                        },
                    },
                },
            },
            {
                resource: db.table('state'),
                options: {
                    navigation: { name: 'Location Management', icon: 'Map' },
                    properties: {
                        image: {
                            type: 'file',
                            components: {
                                edit: Components.ImageUploadComponent,
                                list: Components.ImageShowComponent,
                                show: Components.ImageShowComponent,
                            },
                        },
                        content: {
                            components: {
                                edit: Components.RichTextEditorComponent,
                                show: Components.RichTextEditorShow,
                                list: Components.RichTextEditorList,
                            },
                        },
                        created_at: {
                            isVisible: { list: true, edit: false, filter: false, show: true },
                        },
                        updated_at: {
                            isVisible: { list: true, edit: false, filter: false, show: true },
                        },
                    },
                    actions: {
                        new: {
                            after: async (response, request, context) => {
                                console.log('New city created:', context.record?.params);
                                return response;
                            },
                        },
                        edit: {
                            after: async (response, request, context) => {
                                console.log('City updated:', context.record?.params);
                                return response;
                            },
                        },
                    },
                }
            },
            {
                resource: db.table('city'),
                options: {
                    navigation: { name: 'Location Management', icon: 'Map' },
                    properties: {
                        image: {
                            type: 'file',
                            components: {
                                edit: Components.ImageUploadComponent,
                                list: Components.ImageShowComponent,
                                show: Components.ImageShowComponent,
                            },
                        },
                        content: {
                            components: {
                                edit: Components.RichTextEditorComponent,
                                show: Components.RichTextEditorShow,
                                list: Components.RichTextEditorList,
                            },
                        },
                        created_at: {
                            isVisible: { list: true, edit: false, filter: false, show: true },
                        },
                        updated_at: {
                            isVisible: { list: true, edit: false, filter: false, show: true },
                        },
                    },
                    actions: {
                        new: {
                            after: async (response, request, context) => {
                                console.log('New city created:', context.record?.params);
                                return response;
                            },
                        },
                        edit: {
                            after: async (response, request, context) => {
                                console.log('City updated:', context.record?.params);
                                return response;
                            },
                        },
                    },
                }
            },
        ],
        branding: {
            companyName: 'TMI',
            softwareBrothers: true,
            logo: 'https://www.tourmyindia.com/imgnew/inner_logo.png',
            theme: {
                colors: {
                    primary100: '#ff5a00',
                    primary80: '#ff5a00cc',
                    primary60: '#ff5a0099',
                    primary40: '#ff5a0066',
                    primary20: '#ff5a0033',
                    accent: '#59a84f',
                    love: '#4f625b',
                },
            },
        },
        assets: {
            styles: ['/custom.css', '/css/quill.snow.css'],

        },
        dashboard: {
            component: Components.Dashboard,
        },
        componentLoader,

    });

    const adminRouter = AdminJSExpress.buildRouter(admin);
    return { admin, adminRouter };
};
