import React from "react";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import EscrowLinkCard from '../EscrowLinkCard';
const EscrowLinkCardAny = EscrowLinkCard as unknown as React.ComponentType<Record<string, unknown>>;

// Mock QR code library
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, "aria-label": ariaLabel }: { value: string; "aria-label"?: string }) => (
    <svg data-testid="qr-code" data-value={value} aria-label={ariaLabel} />
  ),
}));

const mockUrl = 'https://trustlink.example.com/pay/1293';

describe('EscrowLinkCard Component', () => {
  const defaultProps = {
    escrowId: '1293',
    url: mockUrl,
    onCopySuccess: vi.fn(),
    onCopyError: vi.fn(),
  };

  async function renderCard(props = defaultProps) {
    const res = render(<EscrowLinkCardAny {...props} />);
    // Wait for the async fetch to finish and card to render
    await screen.findByRole('button', { name: /copy url/i });
    return res;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Stub navigator.clipboard for JSDOM
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Copy to Clipboard Tests (AC #1)', () => {
    test('copy button writes URL to clipboard when clicked', async () => {
      vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
      
      await renderCard();
      
      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockUrl);
    });

    test('shows success feedback when copy succeeds', async () => {
      vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
      
      await renderCard();
      
      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/link copied/i)).toBeInTheDocument();
      });
    });

    test('shows error feedback when copy fails', async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Clipboard error'));
      
      await renderCard();
      
      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Clipboard error/i)).toBeInTheDocument();
      });
    });

    test('calls onCopySuccess callback when copy succeeds', async () => {
      vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
      
      await renderCard();
      
      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);
      
      expect(defaultProps.onCopySuccess).toHaveBeenCalledTimes(1);
      expect(defaultProps.onCopyError).not.toHaveBeenCalled();
    });

    test('calls onCopyError callback when copy fails', async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Clipboard error'));
      
      await renderCard();
      
      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(defaultProps.onCopyError).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('QR Code Tests (AC #2)', () => {
    test('QR code renders with correct URL as value', async () => {
      await renderCard();
      
      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toBeInTheDocument();
      expect(qrCode).toHaveAttribute('data-value', mockUrl);
    });

    test('QR code is rendered when showQRCode prop is true', async () => {
      await renderCard();
      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toBeInTheDocument();
    });

    test('QR code is not rendered when showQRCode prop is false', async () => {
      await renderCard({ ...defaultProps, showQRCode: false } as any);
      
      expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
    });
  });

  describe('WhatsApp Link Tests (AC #3)', () => {
    test('WhatsApp link is correctly encoded with URL', async () => {
      await renderCard();
      
      const whatsappLink = screen.getByRole('button', { name: /share on whatsapp/i });
      
      expect(whatsappLink).toBeInTheDocument();
    });

    test('WhatsApp link opens in new tab', async () => {
      await renderCard();
      
      const whatsappLink = screen.getByRole('button', { name: /share on whatsapp/i });
      expect(whatsappLink).toBeInTheDocument();
    });

    test('WhatsApp button is not rendered when showWhatsApp prop is false', async () => {
      await renderCard({ ...defaultProps, showWhatsApp: false } as any);
      
      expect(screen.queryByRole('button', { name: /share on whatsapp/i })).not.toBeInTheDocument();
    });
  });

  describe('Link Content Tests (AC #4)', () => {
    test('link contains correct escrow ID', async () => {
      await renderCard();
      
      expect(screen.getByText(/Escrow ID: 1293/i)).toBeInTheDocument();
      
      const linkElement = screen.getByTestId('escrow-link') as HTMLInputElement;
      expect(linkElement.value).toContain('pay/1293');
    });

    test('displays the full URL', async () => {
      await renderCard();
      
      expect(screen.getByDisplayValue(mockUrl)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing clipboard API gracefully', async () => {
      // Mock missing clipboard API
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: null },
        configurable: true,
      });
      
      try {
        await renderCard();
        
        const copyButton = screen.getByRole('button', { name: /copy url/i });
        await userEvent.click(copyButton);
        
        await waitFor(() => {
          expect(screen.getByText(/clipboard not supported/i)).toBeInTheDocument();
        });
      } finally {
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          configurable: true,
        });
      }
    });

    test('disables copy button while copying', async () => {
      vi.mocked(navigator.clipboard.writeText).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      await renderCard();
      
      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);
      
      expect(copyButton).toBeDisabled();
      
      await waitFor(() => {
        expect(copyButton).not.toBeDisabled();
      });
    });

    test('renders without optional props', async () => {
      await renderCard({ escrowId: "1293", url: mockUrl } as any);
      
      expect(screen.getByRole('button', { name: /copy url/i })).toBeInTheDocument();
      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('copy button has accessible label', async () => {
      await renderCard();
      
      const copyButton = screen.getByRole('button', { name: /copy url/i });
      expect(copyButton).toBeInTheDocument();
    });

    test('WhatsApp link has accessible label', async () => {
      await renderCard();
      
      const whatsappLink = screen.getByRole('button', { name: /share on whatsapp/i });
      expect(whatsappLink).toBeInTheDocument();
    });

    test('QR code has alt text or aria-label', async () => {
      await renderCard();
      
      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toBeInTheDocument();
    });
  });
});
