import { v4 as uuidv4 } from "uuid";

// Функция для генерации UUID
function generateUUID(): string {
  return uuidv4();
}

// Пример использования
const uuid: string = generateUUID();
console.log("Generated UUID:", uuid);
