import "@testing-library/jest-dom";
import "./lib/i18n";
import { vi } from "vitest";

// Stub navigator.clipboard for JSDOM
if (typeof window !== "undefined" && window.navigator) {
  Object.defineProperty(window.navigator, "clipboard", {
    value: {
      writeText: vi.fn(),
    },
    configurable: true,
    writable: true,
  });
}

// Mock @stellar/freighter-api globally to prevent "Freighter not installed" throws
vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn().mockResolvedValue(true),
  getAddress: vi.fn().mockResolvedValue({ address: "GB1234567890" }),
  signTransaction: vi.fn(),
  isAllowed: vi.fn().mockResolvedValue(true),
  setAllowed: vi.fn().mockResolvedValue(true),
}));

// Mock NetworkProvider globally with spies so tests can override behavior
export const mockUseNetwork = vi.fn().mockReturnValue({
  network: "testnet",
  setNetwork: vi.fn(),
  toggleNetwork: vi.fn(),
  isTestnet: true,
  isMainnet: false,
  config: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
    stellarExpertPrefix: "testnet",
  },
});

vi.mock("./components/providers/NetworkProvider", () => {
  return {
    NetworkProvider: ({ children }: { children: React.ReactNode }) => children,
    useNetwork: mockUseNetwork,
  };
});

// Mock WalletProvider globally with spies so tests can override behavior
export const mockUseWallet = vi.fn().mockReturnValue({
  publicKey: "GB1234567890",
  isConnected: true,
  isConnecting: false,
  connect: vi.fn().mockResolvedValue(true),
  disconnect: vi.fn(),
  token: "mock-jwt-token",
});

vi.mock("./components/providers/WalletProvider", () => {
  return {
    WalletProvider: ({ children }: { children: React.ReactNode }) => children,
    useWallet: mockUseWallet,
  };
});

// Mock NotificationProvider globally with spies so tests can override behavior
export const mockUseNotifications = vi.fn().mockReturnValue({
  notifications: [],
  unreadCount: 0,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  isLoading: false,
});

vi.mock("./components/providers/NotificationProvider", () => {
  return {
    NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
    useNotifications: mockUseNotifications,
  };
});
