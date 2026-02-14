import { contractsClient } from '../../lib/contracts-client';

export default function ContractsPage() {
  const registrySummary = contractsClient.getRegistrySummary();

  return (
    <section className="panel">
      <h3>Contract Registry</h3>
      <p className="muted">Version: {registrySummary.version}</p>
      <ul>
        {registrySummary.contracts.map((contractName) => (
          <li key={contractName}>{contractName}</li>
        ))}
      </ul>
    </section>
  );
}
