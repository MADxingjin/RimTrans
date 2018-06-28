/**
 * Test core/definition.ts
 */

import chalk from 'chalk';
import { readRawContents } from '../scripts/utils';
import init from '../scripts/env-init';
import { RawContents } from '../core/utils';
import * as xml from '../core/xml';
import * as definition from '../core/definition';

const { dirCore } = init();

async function test(): Promise<void> {
  const rawContents: RawContents = await readRawContents(`${dirCore}/Defs/**/*.xml`);

  const dataOrigin: definition.DefinitionData = {};
  Object.entries(rawContents).forEach(([path, content]) => {
    const root: xml.Element = xml.parse(content);
    root.nodes.filter(xml.isElement).forEach(def => {
      if (!dataOrigin[def.name]) {
        dataOrigin[def.name] = [];
      }
      dataOrigin[def.name].push(def);
    });
  });

  const dataParsed: definition.DefinitionData = definition.parse(rawContents);

  console.log(
    'DefType Count:',
    `Origin: ${Object.keys(dataOrigin).length};`,
    `Parsed: ${Object.keys(dataParsed).length};`,
  );

  Object.entries(dataParsed).forEach(([defType, defs]) => {
    if (defs.length !== dataOrigin[defType].length) {
      throw new Error(`Defs count not equal: ${defType}.`);
    }
  });

  const dataList: definition.DefinitionData[] = [dataParsed];

  definition.resolveInheritance(dataList);
  definition.postProcess(dataList);

  Object.entries(dataParsed).forEach(([defType, defs]) => {
    console.log();
    console.log(chalk.greenBright(defType));
    console.log(defs.map(definition.getDefName).join(', '));
  });
}

test().catch(error => console.log(error));
