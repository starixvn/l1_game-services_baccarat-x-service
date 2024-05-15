import { generateCards, updateCards } from "sc-card-game-base/src/helpers/card-chain";
import { randomString, createHashSHA256, encrypt } from "sc-card-game-base/src/helpers/crypto-helper";

export const generateShoe = (cardsFromAdmin, randomMode) => {
    const cards = updateCards(generateCards(8, randomMode), cardsFromAdmin);

    const shoeString = cards.map((card) => `${card.rank}${card.suit}`).toString();

    const rawValue = `${shoeString}_${randomString()}`;
    const hashValue = createHashSHA256(rawValue);
    const encryptedShoe = encrypt(rawValue);
    const encryptedShoeHash = encrypt(hashValue);

    return {
        cards,
        rawValue,
        hashValue,
        encryptedShoe,
        encryptedShoeHash,
    };
};
