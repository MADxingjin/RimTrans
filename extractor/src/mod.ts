import * as io from '@rimtrans/io';
import { loadXML } from './xml';
import {
  ID_CORE,
  DEFAULT_LANGUAGE,
  FILE_NAME_ABOUT,
  FILE_NAME_PREVIEW,
  FILE_NAME_PUBLISHED_FILE_ID,
  FOLDER_NAME_ABOUT,
  FOLDER_NAME_ASSEMBLIES,
  FOLDER_NAME_DEFS,
  FOLDER_NAME_PATCHES,
  FOLDER_NAME_LANGUAGES,
  FOLDER_NAME_TEXTURES,
  FOLDER_NAME_BACKSTORIES,
  FOLDER_NAME_DEF_INJECTED,
  FOLDER_NAME_KEYED,
  FOLDER_NAME_STRINGS,
} from './constants';

// Constants

export interface ModMetaData {
  readonly name: string;
  readonly author: string;
  readonly url: string;
  /**
   * @deprecated
   */
  readonly targetVersion: string;
  readonly description: string;
  readonly supportedVersions: string[];
}

export interface ModOutput {
  pathLanguage(language: string): string;
  pathBackstories(language: string): string;
  pathDefInjected(language: string): string;
  pathKeyed(language: string): string;
  pathStrings(language: string): string;
}

export class Mod implements ModOutput {
  public readonly steamPublishFileId?: string;

  /**
   * The folder name of the mod.
   */
  public readonly identify: string;

  /**
   * Path to the directory of the mod
   */
  public readonly pathRoot: string;

  /**
   * Path to the preview image of the mod.
   */
  public readonly previewImage?: string;

  public readonly pathAbout: string;

  public readonly pathAssemblies: string;

  public readonly pathDefs: string;

  public readonly pathLanguages: string;

  public readonly pathPatches: string;

  public readonly pathTextures: string;

  public readonly meta: ModMetaData;

  private constructor(
    pathRoot: string,
    modeMetaData: ModMetaData,
    preview?: string,
    publishFileId?: string,
  ) {
    this.steamPublishFileId = publishFileId;

    this.identify = io.fileName(pathRoot);
    this.pathRoot = pathRoot;

    this.previewImage = preview
      ? io.join(pathRoot, FOLDER_NAME_ABOUT, preview)
      : undefined;

    this.pathAbout = io.join(pathRoot, FOLDER_NAME_ABOUT);
    this.pathAssemblies = io.join(pathRoot, FOLDER_NAME_ASSEMBLIES);
    this.pathDefs = io.join(pathRoot, FOLDER_NAME_DEFS);
    this.pathLanguages = io.join(pathRoot, FOLDER_NAME_LANGUAGES);
    this.pathPatches = io.join(pathRoot, FOLDER_NAME_PATCHES);
    this.pathTextures = io.join(pathRoot, FOLDER_NAME_TEXTURES);

    this.meta = modeMetaData;
  }

  public pathLanguage(language: string): string {
    return io.join(this.pathLanguages, language);
  }

  public pathBackstories(language: string): string {
    return io.join(this.pathLanguages, language, FOLDER_NAME_BACKSTORIES);
  }

  public pathDefInjected(language: string): string {
    return io.join(this.pathLanguages, language, FOLDER_NAME_DEF_INJECTED);
  }

  public pathKeyed(language: string): string {
    return io.join(this.pathLanguages, language, FOLDER_NAME_KEYED);
  }

  public pathStrings(language: string): string {
    return io.join(this.pathLanguages, language, FOLDER_NAME_STRINGS);
  }

  public output(directory: string): ModOutput {
    const folderLanguages = io.join(directory, FOLDER_NAME_LANGUAGES);
    return {
      pathLanguage(language: string): string {
        return io.join(folderLanguages, language);
      },
      pathBackstories(language: string): string {
        return io.join(folderLanguages, language, FOLDER_NAME_BACKSTORIES);
      },
      pathDefInjected(language: string): string {
        return io.join(folderLanguages, language, FOLDER_NAME_DEF_INJECTED);
      },
      pathKeyed(language: string): string {
        return io.join(folderLanguages, language, FOLDER_NAME_KEYED);
      },
      pathStrings(language: string): string {
        return io.join(folderLanguages, language, FOLDER_NAME_STRINGS);
      },
    };
  }

  public static async load(path: string): Promise<Mod> {
    const identify = io.fileName(path);
    const pathAbout = io.join(path, FOLDER_NAME_ABOUT);
    const pathAboutXML = io.join(pathAbout, FILE_NAME_ABOUT);
    const pathPublishFileId = io.join(pathAbout, FILE_NAME_PUBLISHED_FILE_ID);

    const [meta, preview, publishFileId] = await Promise.all([
      io.fileExists(pathAboutXML).then(
        async (exists): Promise<ModMetaData> => {
          const metaData: ModMetaData = {
            name: identify,
            author: 'Anonymous',
            url: '',
            description: 'No description provided.',
            targetVersion: 'Unknown',
            supportedVersions: [],
          };

          if (exists) {
            const root = await loadXML(pathAboutXML);
            Object.entries(metaData).forEach(([key, value]) => {
              const isArray = Array.isArray(value);
              const element = root.elements.find(c => c.name === key);
              if (!element) {
                return;
              }
              /* eslint-disable @typescript-eslint/no-explicit-any */
              if (isArray) {
                (metaData as any)[key] = element.elements
                  .map(li => li.value.trim())
                  .filter(v => !!v);
                return;
              }
              if (element.value.trim()) {
                (metaData as any)[key] = element.value.trim();
              }
              /* eslint-enable @typescript-eslint/no-explicit-any */
            });
          }
          return metaData;
        },
      ),

      io
        .search([FILE_NAME_PREVIEW], { cwd: pathAbout, case: false, onlyFiles: true })
        .then(files => (files.length > 0 ? files[0] : undefined))
        .catch(() => undefined),

      io.fileExists(pathPublishFileId).then(async exists => {
        if (exists) {
          return (await io.read(pathPublishFileId)).trim();
        }
        return undefined;
      }),
    ]);

    const mod = new Mod(path, meta, preview, publishFileId);

    return mod;
  }
}
