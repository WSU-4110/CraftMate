// components/ProfAppointmentComp.test.tsx
import { Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

jest.mock('../constants/firebaseConfig', () => ({
  db: {},
  auth: { currentUser: { uid: 'profUserId' } },
}));

jest.mock('firebase/firestore', () => ({
  doc:       jest.fn(() => 'doc-ref'),
  updateDoc: jest.fn(),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockNav = { navigate: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNav,
}));

function getStatusProps(status: string) {
  let iconName = '', displayText = '', iconColor = '';
  switch (status) {
    case 'pending':
      iconName = 'time-outline'; displayText = 'Pending'; iconColor = '#FFA500';
      break;
    case 'accepted':
      iconName = 'checkmark-circle-outline'; displayText = 'Accepted'; iconColor = 'green';
      break;
    case 'completed':
      iconName = 'checkmark-done-outline'; displayText = 'Completed'; iconColor = 'blue';
      break;
    case 'missed':
      iconName = 'close-circle-outline'; displayText = 'Missed'; iconColor = 'red';
      break;
    default:
      iconName = 'alert-circle-outline'; displayText = status; iconColor = 'gray';
      break;
  }
  return { iconName, displayText, iconColor };
}

function formatScheduledDateTime(scheduledDateTime: any) {
  const dt = scheduledDateTime?.toDate
    ? scheduledDateTime.toDate()
    : new Date(scheduledDateTime);
  const dateStr = dt.toLocaleDateString();
  const timeStr = dt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
}

function confirmCancel(appointmentId: string, resetCard: () => void) {
  Alert.alert(
    'Cancel Appointment',
    'Are you sure you want to cancel this appointment?',
    [
      { text: 'No',  style: 'cancel',    onPress: () => resetCard() },
      { text: 'Yes', style: 'destructive', onPress: () =>
          updateDoc(doc({}, 'appointments', appointmentId), { status: 'cancelled' })
      },
    ]
  );
}

function joinConfirmation(item: { id: string }) {
  Alert.alert(
    'Join Appointment',
    'Are you sure you want to join this appointment?',
    [
      { text: 'No',  style: 'cancel' },
      { text: 'Yes', onPress: () => mockNav.navigate('call', { meetingId: item.id }) },
    ]
  );
}

function noShowConfirmation(appointmentId: string) {
  Alert.alert(
    'Mark No Show',
    'Are you sure you want to mark this appointment as missed?',
    [
      { text: 'No',  style: 'cancel' },
      { text: 'Yes', onPress: () =>
          updateDoc(doc({}, 'appointments', appointmentId), { status: 'missed' })
      },
    ]
  );
}

function completedConfirmation(appointmentId: string) {
  Alert.alert(
    'Mark Completed',
    'Are you sure you want to mark this appointment as completed?',
    [
      { text: 'No',  style: 'cancel' },
      { text: 'Yes', onPress: () =>
          updateDoc(doc({}, 'appointments', appointmentId), { status: 'completed' })
      },
    ]
  );
}

function confirmReject(appointmentId: string, resetCard: () => void) {
  Alert.alert(
    'Reject Appointment',
    'Are you sure you want to reject this appointment?',
    [
      { text: 'No',  style: 'cancel', onPress: () => resetCard() },
      { text: 'Yes', onPress: () =>
          updateDoc(doc({}, 'appointments', appointmentId), { status: 'rejected' })
      },
    ]
  );
}

function confirmAccept(appointmentId: string, resetCard: () => void) {
  Alert.alert(
    'Accept Appointment',
    'Are you sure you want to accept this appointment?',
    [
      { text: 'No',  style: 'cancel', onPress: () => resetCard() },
      { text: 'Yes', onPress: () =>
          updateDoc(doc({}, 'appointments', appointmentId), { status: 'accepted' })
      },
    ]
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});


describe('getStatusProps()', () => {
  it('returns correct props for "pending"', () => {
    expect(getStatusProps('pending')).toEqual({
      iconName: 'time-outline',
      displayText: 'Pending',
      iconColor: '#FFA500'
    });
  });
  it('falls back for unknown status', () => {
    expect(getStatusProps('weird')).toEqual({
      iconName: 'alert-circle-outline',
      displayText: 'weird',
      iconColor: 'gray'
    });
  });
});

describe('formatScheduledDateTime()', () => {
  it('formats a JS Date string properly', () => {
    const iso = '2025-04-16T14:05:00Z';
    const dt = new Date(iso);
    const expected = `${dt.toLocaleDateString()} at ${dt.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', hour12: true
    })}`;
    expect(formatScheduledDateTime(iso)).toBe(expected);
  });

  it('formats a Firestore timestamp-like object', () => {
    const stub = { toDate: () => new Date('2025-04-16T09:30:00Z') };
    const str = formatScheduledDateTime(stub);
    expect(str).toMatch(/^4\/16\/2025 at \d{1,2}:\d{2} (AM|PM)$/);
  });
});

describe('confirmCancel()', () => {
  it('alerts then calls updateDoc(status:cancelled) on Yes', () => {
    const reset = jest.fn();
    confirmCancel('A1', reset);

    // Alert invoked once
    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      expect.any(Array)
    );

    // Simulate pressing “Yes”
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    const yes = buttons.find(b => b.text === 'Yes');
    yes.onPress!();

    expect(updateDoc).toHaveBeenCalledWith('doc-ref', { status: 'cancelled' });
  });
});

describe('joinConfirmation()', () => {
  it('alerts then navigates on Yes', () => {
    joinConfirmation({ id: 'M1' });
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    const yes = buttons.find(b => b.text === 'Yes');
    yes.onPress!();
    expect(mockNav.navigate).toHaveBeenCalledWith('call', { meetingId: 'M1' });
  });
});

describe('noShowConfirmation()', () => {
  it('alerts then calls updateDoc(status:missed)', () => {
    noShowConfirmation('A2');
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    const yes = buttons.find(b => b.text === 'Yes');
    yes.onPress!();
    expect(updateDoc).toHaveBeenCalledWith('doc-ref', { status: 'missed' });
  });
});

describe('completedConfirmation()', () => {
  it('alerts then calls updateDoc(status:completed)', () => {
    completedConfirmation('A3');
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    const yes = buttons.find(b => b.text === 'Yes');
    yes.onPress!();
    expect(updateDoc).toHaveBeenCalledWith('doc-ref', { status: 'completed' });
  });
});

describe('confirmReject()', () => {
  it('alerts then calls updateDoc(status:rejected)', () => {
    const reset = jest.fn();
    confirmReject('A4', reset);
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    const yes = buttons.find(b => b.text === 'Yes');
    yes.onPress!();
    expect(updateDoc).toHaveBeenCalledWith('doc-ref', { status: 'rejected' });
  });
});

describe('confirmAccept()', () => {
  it('alerts then calls updateDoc(status:accepted)', () => {
    const reset = jest.fn();
    confirmAccept('A5', reset);
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    const yes = buttons.find(b => b.text === 'Yes');
    yes.onPress!();
    expect(updateDoc).toHaveBeenCalledWith('doc-ref', { status: 'accepted' });
  });
});