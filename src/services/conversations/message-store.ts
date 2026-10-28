import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { safeValidateUIMessages, type UIMessage } from "ai";
import { z } from "zod";
import { CONVERSATIONS_FILE } from "../../config/data-paths";
import { StoredConversationInvalidError } from "../../domain/errors";

const EMPTY_STORE_JSON = "{}";
const FILE_NOT_FOUND_CODE = "ENOENT";

const storeSchema = z.record(z.string(), z.unknown());

const isFileNotFound = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === FILE_NOT_FOUND_CODE;

const readRawStore = async (): Promise<string> => {
  try {
    return await readFile(CONVERSATIONS_FILE, "utf8");
  } catch (error) {
    if (isFileNotFound(error)) {
      return EMPTY_STORE_JSON;
    }

    throw error;
  }
};

const readStore = async (): Promise<Readonly<Record<string, unknown>>> =>
  storeSchema.parse(JSON.parse(await readRawStore()));

export const readMessages = async (employeeId: string): Promise<UIMessage[]> => {
  const store = await readStore();
  const validated = await safeValidateUIMessages({ messages: store[employeeId] ?? [] });

  if (!validated.success) {
    throw new StoredConversationInvalidError(employeeId, { cause: validated.error });
  }

  return validated.data;
};

export const writeMessages = async (
  employeeId: string,
  messages: readonly UIMessage[],
): Promise<void> => {
  const store = await readStore();

  await mkdir(path.dirname(CONVERSATIONS_FILE), { recursive: true });
  await writeFile(CONVERSATIONS_FILE, JSON.stringify({ ...store, [employeeId]: messages }), "utf8");
};
