import webUiMd from '../../../docs/platforms/Web UI.md?raw';
import vscodeMd from '../../../docs/platforms/VSCode.md?raw';
import serverMd from '../../../docs/platforms/Server.md?raw';
import websitesMd from '../../../docs/platforms/OpenGrok, SourceGraph, Github, Gitlab.md?raw';
import jebMd from '../../../docs/platforms/JEB.md?raw';
import jadxMd from '../../../docs/platforms/JADX.md?raw';
import idaMd from '../../../docs/platforms/IDA.md?raw';
import ghidraMd from '../../../docs/platforms/Ghidra.md?raw';
import jetbrainsMd from '../../../docs/platforms/Android Studio, Intellij, Clion, PHPStorm, GoLand, Pycharm, Rubymine.md?raw';

export type HelpPlatformId =
  | 'webUi'
  | 'server'
  | 'jetbrains'
  | 'websites'
  | 'jeb'
  | 'ida'
  | 'jadx'
  | 'ghidra'
  | 'vscode';

export type HelpPlatform = {
  id: HelpPlatformId;
  title: string;
  /** Path under `public/`, e.g. `/platforms/python.svg` */
  iconSrc: string;
  markdown: string;
  downloadFilename?: string;
};

export function getHelpPlatforms(version: string): HelpPlatform[] {
  const v = version;
  const file = (suffix: string) => `graffiti_v${v}_${suffix}`;

  return [
    {
      id: 'webUi',
      title: 'Web UI',
      iconSrc: '/icon.png',
      markdown: webUiMd,
      downloadFilename: file('frontend_web.zip'),
    },
    {
      id: 'server',
      title: 'Server',
      iconSrc: '/platforms/python.svg',
      markdown: serverMd,
      downloadFilename: file('server.pyz'),
    },
    {
      id: 'jetbrains',
      title: 'Android Studio, Intellij, Clion, PHPStorm, GoLand, Pycharm, Rubymine',
      iconSrc: '/platforms/jetbrains.svg',
      markdown: jetbrainsMd,
      downloadFilename: file('for_jetbrains.zip'),
    },
    {
      id: 'websites',
      title: 'OpenGrok, SourceGraph, Github, Gitlab',
      iconSrc: '/platforms/websites.png',
      markdown: websitesMd,
      downloadFilename: file('for_opengrok_sourcegraph_github_gitlab.zip'),
    },
    {
      id: 'jeb',
      title: 'JEB',
      iconSrc: '/platforms/JEB.png',
      markdown: jebMd,
      downloadFilename: file('for_jeb.zip'),
    },
    {
      id: 'ida',
      title: 'IDA',
      iconSrc: '/platforms/IDA.png',
      markdown: idaMd,
      downloadFilename: file('for_ida.zip'),
    },
    {
      id: 'jadx',
      title: 'JADX',
      iconSrc: '/platforms/Jadx.svg',
      markdown: jadxMd,
      downloadFilename: file('for_jadx.jar'),
    },
    {
      id: 'ghidra',
      title: 'Ghidra',
      iconSrc: '/platforms/Ghidra.svg',
      markdown: ghidraMd,
      downloadFilename: file('for_ghidra.zip'),
    },
    {
      id: 'vscode',
      title: 'VSCode',
      iconSrc: '/platforms/Visual_Studio_Code.svg',
      markdown: vscodeMd,
      downloadFilename: file('for_vscode.vsix'),
    },
  ];
}

