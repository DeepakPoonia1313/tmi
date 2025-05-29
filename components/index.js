import { ComponentLoader } from 'adminjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentLoader = new ComponentLoader();

const Components = {
    AvatarList: componentLoader.add('AvatarList', path.join(__dirname, 'AvatarList.jsx')),

    AvatarShow: componentLoader.add('AvatarShow', path.join(__dirname, 'AvatarShow.jsx')),

    AvatarEdit: componentLoader.add('AvatarEdit', path.join(__dirname, 'AvatarEdit.jsx')),

    Dashboard: componentLoader.add('Dashboard', path.join(__dirname, 'HomeDashboard.jsx')),

    CustomSidebarFooter: componentLoader.override('SidebarFooter', path.join(__dirname, 'layout', 'CustomSidebarFooter.jsx')),

    ImageUploadComponent: componentLoader.add('ImageUploadComponent', path.join(__dirname, 'images', 'ImageUploadComponent.jsx')),

    ImageShowComponent: componentLoader.add('ImageShowComponent', path.join(__dirname, 'images', 'ImageShowComponent.jsx')),

    CustomTopBar: componentLoader.override('TopBar', path.join(__dirname, 'layout', 'CustomTopBar.jsx')),

    // CustomSidebarResourceSection: componentLoader.override('SidebarResourceSection', path.join(__dirname, 'layout','CustomSidebarResourceSection.jsx')),

    RichTextEditorComponent: componentLoader.add('RichTextEditor', path.join(__dirname, 'textEditor', 'RichTextEditor.jsx')),
    RichTextEditorShow: componentLoader.add('RichTextEditorShow', path.join(__dirname, 'textEditor', 'RichTextEditorShow.jsx')),
    RichTextEditorList: componentLoader.add('RichTextEditorList', path.join(__dirname, 'textEditor', 'RichTextEditorList.jsx')),
    LargeTextShow: componentLoader.add('LargeTextShow', path.join(__dirname, 'largeText', 'LargeTextShow.jsx')),

    MultiStateSelector: componentLoader.add('MultiStateSelector', path.join(__dirname, 'arraySelects', 'MultiStateSelector.jsx')),
    ListComponent: componentLoader.add('ListComponent', path.join(__dirname, 'wholeComponents', 'ListComponent.jsx')),

};

// Log to verify components are loaded
console.log('Loaded Components:', Components);

export { componentLoader, Components };