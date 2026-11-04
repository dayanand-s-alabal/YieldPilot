const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add new icon imports to the lucide imports block
content = content.replace(
  "  ShieldAlert\r\n} from 'lucide-react';",
  "  ShieldAlert,\r\n  BarChart3,\r\n  TrendingUp\r\n} from 'lucide-react';"
);

// 2. Add new component imports after RebalancingDashboard import
content = content.replace(
  "import { RebalancingDashboard } from './components/rebalancing/RebalancingDashboard';\r\nimport { SEPOLIA_CHAIN_ID } from './contracts/addresses';",
  "import { RebalancingDashboard } from './components/rebalancing/RebalancingDashboard';\r\nimport { StrategyPerformanceAnalytics } from './components/analytics/StrategyPerformanceAnalytics';\r\nimport { EmergencyRiskManagement } from './components/emergency/EmergencyRiskManagement';\r\nimport { SEPOLIA_CHAIN_ID } from './contracts/addresses';"
);

// 3. Add new nav items to the nav array
content = content.replace(
  "              { id: 'settings', label: 'Settings', icon: SettingsIcon },",
  "              { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },\r\n              { id: 'emergency', label: 'Emergency Management', icon: ShieldAlert },\r\n              { id: 'settings', label: 'Settings', icon: SettingsIcon },"
);

// 4. Add new tab renders before the closing of main
const profileTabBlock = `          {activeTab === 'profile' && (\r\n            <ProfileView blockchainData={blockchainData} />\r\n          )}\r\n\r\n          {activeTab === 'settings' && (\r\n            <SettingsView \r\n              darkMode={darkMode} \r\n              setDarkMode={setDarkMode} \r\n              isSepolia={isSepolia} \r\n            />\r\n          )}`;

const newTabBlocks = `          {activeTab === 'profile' && (\r\n            <ProfileView blockchainData={blockchainData} />\r\n          )}\r\n\r\n          {activeTab === 'analytics' && (\r\n            <StrategyPerformanceAnalytics blockchainData={blockchainData} />\r\n          )}\r\n\r\n          {activeTab === 'emergency' && (\r\n            <EmergencyRiskManagement blockchainData={blockchainData} txManager={txManager} />\r\n          )}\r\n\r\n          {activeTab === 'settings' && (\r\n            <SettingsView \r\n              darkMode={darkMode} \r\n              setDarkMode={setDarkMode} \r\n              isSepolia={isSepolia} \r\n            />\r\n          )}`;

content = content.replace(profileTabBlock, newTabBlocks);

fs.writeFileSync(filePath, content, 'utf8');
console.log('App.jsx updated successfully');

// verify the changes
const updated = fs.readFileSync(filePath, 'utf8');
const hasAnalytics = updated.includes("StrategyPerformanceAnalytics");
const hasEmergency = updated.includes("EmergencyRiskManagement");
const hasAnalyticsNav = updated.includes("'analytics'");
const hasEmergencyNav = updated.includes("'emergency'");
console.log('StrategyPerformanceAnalytics imported:', hasAnalytics);
console.log('EmergencyRiskManagement imported:', hasEmergency);
console.log('Analytics nav item:', hasAnalyticsNav);
console.log('Emergency nav item:', hasEmergencyNav);
