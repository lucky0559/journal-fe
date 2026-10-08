import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip } from './Chip';
import { Segmented } from './Segmented';
import { Toggle } from './Toggle';

it('Chip reports selection and presses', () => {
  const onPress = jest.fn();
  render(<Chip label="calm" selected onPress={onPress} />);
  expect(screen.getByRole('button', { name: 'calm' })).toBeSelected();
  fireEvent.press(screen.getByText('calm'));
  expect(onPress).toHaveBeenCalled();
});

it('Segmented switches value', () => {
  const onChange = jest.fn();
  render(<Segmented options={[{ key: 'cal', label: 'Calendar' }, { key: 'list', label: 'List' }]} value="cal" onChange={onChange} />);
  fireEvent.press(screen.getByText('List'));
  expect(onChange).toHaveBeenCalledWith('list');
});

it('Toggle flips and exposes switch semantics', () => {
  const onChange = jest.fn();
  render(<Toggle value={false} onChange={onChange} accessibilityLabel="Nightly nudge" />);
  const sw = screen.getByRole('switch', { name: 'Nightly nudge' });
  expect(sw).not.toBeChecked();
  fireEvent.press(sw);
  expect(onChange).toHaveBeenCalledWith(true);
});
