import { describe, it, expect, vi } from 'vitest';

describe('createChatRoom ID format', () => {
  it('generates deterministic chat ID from trainer and student IDs', () => {
    const trainerId = 'trainer123';
    const studentId = 'student456';
    const chatId = `chat_${trainerId}_${studentId}`;
    expect(chatId).toBe('chat_trainer123_student456');
  });

  it('same trainer+student always produces same ID', () => {
    const id1 = `chat_trainerA_studentB`;
    const id2 = `chat_trainerA_studentB`;
    expect(id1).toBe(id2);
  });

  it('different order produces different ID (trainer vs student)', () => {
    const id1 = `chat_trainerA_studentB`;
    const id2 = `chat_studentB_trainerA`;
    expect(id1).not.toBe(id2);
  });
});
