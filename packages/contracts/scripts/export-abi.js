/**
 * Export compiled ABIs to the frontend package.
 * Run after `npx hardhat compile`.
 */
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts', 'evm');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'client', 'src', 'lib', 'contracts', 'abis');

const contracts = [
  { name: 'NexusGovernanceHub', outputName: 'NexusGovernanceHub.generated.ts' },
  { name: 'NexusGovernanceMirror', outputName: 'NexusGovernanceMirror.generated.ts' },
];

for (const contract of contracts) {
  const artifactPath = path.join(ARTIFACTS_DIR, `${contract.name}.sol`, `${contract.name}.json`);

  if (!fs.existsSync(artifactPath)) {
    console.warn(`Artifact not found: ${artifactPath} — skipping ${contract.name}`);
    continue;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = JSON.stringify(artifact.abi, null, 2);

  const output = `// Auto-generated from compiled contract. Do not edit manually.\n// Run: npm run export-abi\n\nexport const ${contract.name.toUpperCase().replace(/([a-z])([A-Z])/g, '$1_$2')}_ABI = ${abi} as const;\n`;

  const outputPath = path.join(OUTPUT_DIR, contract.outputName);
  fs.writeFileSync(outputPath, output);
  console.log(`Exported ${contract.name} ABI to ${outputPath}`);
}

console.log('ABI export complete.');
