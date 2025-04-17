
import { Alert } from 'react-native';
import { doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

// Mock out firebaseConfig
jest.mock('../constants/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'currentUserId' } },
  db: {},
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'doc-ref'),
  updateDoc: jest.fn(),
  addDoc:    jest.fn(),
  deleteDoc: jest.fn(),
}));

// Mock Alert.alert 
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation 
const mockNav = { navigate: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNav,
}));


// Helper #1: status props
const getStatusProps = (status: string) => {
  let iconName = '', displayText = '', iconColor = '';
  switch (status) {
    case 'pending':
      iconName = 'time-outline'; displayText = 'Pending'; iconColor = '#FFA500'; break;
    case 'accepted':
      iconName = 'checkmark-circle-outline'; displayText = 'Accepted'; iconColor = 'green'; break;
    case 'completed':
      iconName = 'checkmark-done-outline'; displayText = 'Completed'; iconColor = 'blue'; break;
    case 'missed':
      iconName = 'close-circle-outline'; displayText = 'Missed'; iconColor = 'red'; break;
    default:
      iconName = 'alert-circle-outline'; displayText = status; iconColor = 'gray'; break;
  }
  return { iconName, displayText, iconColor };
};

// Helper #2: confirmCancel
const confirmCancel = (appointmentId: string, resetCard: () => void) => {
  Alert.alert(
    'Cancel Appointment',
    'Are you sure you want to cancel this appointment?',
    [
      { text: 'No',  style: 'cancel',    onPress: () => resetCard() },
      {
        text: 'Yes', style: 'destructive',
        onPress: () => updateDoc(doc({}, 'appointments', appointmentId), { status:'cancelled' })
      },
    ]
  );
};

// Helper #3: handleJoin
const handleJoin = (appointment: { id: string }) => {
  mockNav.navigate('call', { meetingId: appointment.id });
};

// Helper #4: renderStars logic
const makeStars = (ratingValue: number) => {
  const stars: string[] = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(ratingValue >= i ? 'star' : 'star-outline');
  }
  return stars;
};

// Helper #5: submitReview
type SubmitArgs = {
  existingReview: { id: string } | null;
  ratingValue: number;
  reviewText: string;
  appointmentId: string;
};
const submitReview = async ({ existingReview, ratingValue, reviewText, appointmentId }: SubmitArgs) => {
  if (ratingValue === 0) {
    Alert.alert('Error','Please select a star rating.');
    return;
  }
  const data = { appointmentId, reviewText, ratingValue };
  if (existingReview) {
    await updateDoc(doc({}, 'reviews', existingReview.id), data);
  } else {
    await addDoc(doc({}, 'reviews'), data);
  }
  Alert.alert('Success','Review submitted!');
};

// Helper #6: deleteReview
const deleteReview = (existingReview: { id: string }) => {
  Alert.alert(
    'Delete Review',
    'Are you sure you want to delete this review?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          deleteDoc(doc({}, 'reviews', existingReview.id));
          Alert.alert('Success','Review deleted.');
        }
      },
    ]
  );
};

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Tests

describe('getStatusProps()', () => {
  it('maps "pending" correctly', () => {
    expect(getStatusProps('pending')).toEqual({
      iconName: 'time-outline',
      displayText: 'Pending',
      iconColor: '#FFA500'
    });
  });
  it('falls back on unknown', () => {
    const props = getStatusProps('foobar');
    expect(props).toEqual({
      iconName: 'alert-circle-outline',
      displayText: 'foobar',
      iconColor: 'gray'
    });
  });
});

describe('confirmCancel()', () => {
  it('triggers Alert and updateDoc on Yes', () => {
    const reset = jest.fn();
    confirmCancel('A1', reset);

    // Alert called once
    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      expect.any(Array)
    );

    // simulate pressing "Yes"
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const yesBtn = buttons.find((b: any) => b.text === 'Yes');
    yesBtn.onPress();

    expect(updateDoc).toHaveBeenCalledWith('doc-ref', { status:'cancelled' });
  });
});

describe('handleJoin()', () => {
  it('navigates to the call screen', () => {
    handleJoin({ id:'MEET123' });
    expect(mockNav.navigate).toHaveBeenCalledWith('call', { meetingId:'MEET123' });
  });
});

describe('makeStars()', () => {
  it('returns five entries with correct filled vs outline', () => {
    const stars = makeStars(3);
    expect(stars).toEqual(['star','star','star','star-outline','star-outline']);
  });
});

describe('submitReview()', () => {
  it('alerts error if ratingValue is zero', async () => {
    await submitReview({ existingReview: null, ratingValue:0, reviewText:'', appointmentId:'X' });
    expect(Alert.alert).toHaveBeenCalledWith('Error','Please select a star rating.');
  });
  it('calls addDoc + success alert when no existingReview', async () => {
    await submitReview({ existingReview: null, ratingValue:4, reviewText:'Yay', appointmentId:'B1' });
    expect(addDoc).toHaveBeenCalledWith('doc-ref', expect.objectContaining({
      appointmentId:'B1', reviewText:'Yay', ratingValue:4
    }));
    expect(Alert.alert).toHaveBeenCalledWith('Success','Review submitted!');
  });
  it('calls updateDoc + success alert when existingReview exists', async () => {
    await submitReview({ existingReview:{id:'R1'}, ratingValue:5, reviewText:'👍', appointmentId:'B2' });
    expect(updateDoc).toHaveBeenCalledWith('doc-ref', expect.objectContaining({
      appointmentId:'B2', reviewText:'👍', ratingValue:5
    }));
    expect(Alert.alert).toHaveBeenCalledWith('Success','Review submitted!');
  });
});

describe('deleteReview()', () => {
  it('alerts confirmation then calls deleteDoc + success', () => {
    deleteReview({ id:'R2' });
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const delBtn = buttons.find((b: any) => b.text === 'Delete');
    delBtn.onPress();
    expect(deleteDoc).toHaveBeenCalledWith('doc-ref');
    expect(Alert.alert).toHaveBeenCalledWith('Success','Review deleted.');
  });
});
