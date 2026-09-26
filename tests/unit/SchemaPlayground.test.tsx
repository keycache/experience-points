import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaPlayground } from '../../src/components/dev/SchemaPlayground';

describe('SchemaPlayground (temporary developer view)', () => {
  it('shows a success message for valid JSON', async () => {
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    // user-event's `type` treats "{" as the start of a special key
    // sequence, so a literal "{" must be escaped as "{{". A lone "}" has
    // no special meaning and does not need escaping.
    await user.type(
      screen.getByLabelText(/json input/i),
      '{{"personal": {{"fullName": "Jamie Rivera"}}',
    );
    await user.click(screen.getByRole('button', { name: /validate/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/valid/i);
  });

  it('shows a readable error for invalid JSON', async () => {
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    await user.type(screen.getByLabelText(/json input/i), '{{ not valid json');
    await user.click(screen.getByRole('button', { name: /validate/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/not valid json/i);
  });

  it('shows readable validation issues for JSON that fails the schema', async () => {
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    await user.type(screen.getByLabelText(/json input/i), '{{}');
    await user.click(screen.getByRole('button', { name: /validate/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/does not match/i);
  });
});
