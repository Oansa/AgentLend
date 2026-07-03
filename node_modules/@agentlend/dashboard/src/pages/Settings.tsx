import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';

export function Settings() {
  const { theme, toggleTheme, network, setNetwork } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your AgentLend dashboard</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Theme</span>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === 'light' ? 'Dark' : 'Light'} Mode
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span>Network</span>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'testnet')}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="testnet">Testnet (Sepolia)</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Oracle Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connects to AgentLend ML Oracle at http://localhost:3001
          </p>
        </CardContent>
      </Card>
    </div>
  );
}