import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Button, Choice, Page } from '../src/components/ui';
import { ReportingScreen } from '../src/features/reporting';
import { WellbeingScreen } from '../src/features/wellbeing';
import { SafetyScreen } from '../src/features/safety';
import { api, useData } from '../src/lib/api';
import { SafeAreaProvider } from 'react-native-safe-area-context';
const nav = { navigate: jest.fn(), replace: jest.fn(), canGoBack: () => false, goBack: jest.fn() };
function wrap(node: React.ReactNode) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      {node}
    </SafeAreaProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  (useData as jest.Mock).mockReturnValue({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });
});
it('prevents duplicate action submissions while a request is pending', async () => {
  let finish!: () => void;
  const action = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const screen = render(<Button title="Save" onPress={action} successMessage="Saved" />);
  fireEvent.press(screen.getByLabelText('Save'));
  fireEvent.press(screen.getByLabelText('Save'));
  expect(action).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  expect(screen.getByText('Saved')).toBeTruthy();
});
it('shows a rejected privacy preference without swallowing the error', async () => {
  const screen = render(
    <Choice
      label="Share"
      selected={false}
      onPress={async () => {
        throw new Error('Offline');
      }}
    />,
  );
  fireEvent.press(screen.getByLabelText('Share'));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Offline'));
});
it('keeps the disguise free of the Suraksha header', () => {
  const screen = render(
    wrap(
      <Page title="Calculator" discreet>
        <Button title="1" onPress={() => {}} />
      </Page>,
    ),
  );
  expect(screen.queryByText('SURAKSHA')).toBeNull();
  expect(screen.queryByText('Your private space')).toBeNull();
});
it('rejects impossible report dates before sending a report', async () => {
  const screen = render(wrap(<ReportingScreen navigation={nav} route={{ name: 'M25' }} />));
  fireEvent.changeText(screen.getByLabelText('When did this happen? (YYYY-MM-DD)'), '2026-02-31');
  fireEvent.press(screen.getByLabelText(/Submit report/));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Enter a valid date/));
  expect(api).not.toHaveBeenCalled();
});
it('disables empty legal messages', () => {
  const screen = render(wrap(<ReportingScreen navigation={nav} route={{ name: 'M23' }} />));
  expect(screen.getByLabelText('Send message')).toBeDisabled();
});
it('allows consent to be withdrawn and reflects the server state', async () => {
  const refetch = jest.fn();
  (api as jest.Mock).mockResolvedValue({ ok: true });
  (useData as jest.Mock).mockImplementation((path) => ({
    data: path?.startsWith('/wellbeing/') ? { shared: true, answer: 'Several days' } : null,
    isLoading: false,
    error: null,
    refetch,
  }));
  const screen = render(
    wrap(<WellbeingScreen navigation={nav} route={{ name: 'M30', params: { id: 'check-in' } }} />),
  );
  expect(screen.getByText('SHARED BY YOU')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Share this check-in with my assigned counselor'));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith('/wellbeing/check-ins/check-in', 'PATCH', { shared: false }),
  );
  expect(refetch).toHaveBeenCalled();
});
it('records an SOS after a complete hold even when location permission is denied', async () => {
  jest.useFakeTimers();
  (api as jest.Mock).mockResolvedValue({ id: 'alert-1' });
  try {
    const screen = render(wrap(<SafetyScreen navigation={nav} route={{ name: 'M13' }} />));
    fireEvent(screen.getByLabelText('Hold for two seconds to activate SOS'), 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(2100);
    });
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        '/sos',
        'POST',
        expect.objectContaining({ locationState: 'DENIED', idempotencyKey: expect.any(String) }),
      ),
    );
    expect(nav.replace).toHaveBeenCalledWith('M14', { id: 'alert-1' });
  } finally {
    jest.useRealTimers();
  }
});
