import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';
import { Input } from './Input';

describe('shared UI foundation', () => {
  it('expõe estado de carregamento e bloqueia clique duplicado', () => {
    const onClick = vi.fn();

    render(
      <Button loading loadingLabel="Salvando…" onClick={onClick}>
        Salvar
      </Button>,
    );

    const button = screen.getByRole('button', { name: /salvando/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('associa label ao input', () => {
    render(<Input label="Email" name="email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('name', 'email');
  });

  it('liga erro ao campo de forma acessível', () => {
    render(
      <Input
        label="Nome"
        name="nome"
        error="Informe seu nome."
      />,
    );

    const input = screen.getByLabelText('Nome');
    const alert = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', alert.id);
    expect(alert).toHaveTextContent('Informe seu nome.');
  });

  it('expõe obrigatório também para leitor de tela', () => {
    render(<Input label="Senha" name="password" required />);

    expect(screen.getByLabelText(/Senha.*obrigatório/i)).toBeRequired();
  });
});
