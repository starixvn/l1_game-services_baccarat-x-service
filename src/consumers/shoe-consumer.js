import { Helpers } from "sc-card-game-base";
import { getCardFromString } from "../helpers/card-helper";

export default class ShoeConsumer {
    constructor(gameData, resultsRepository, roundsRepository, cutCardPFRepository) {
        this.gameData = gameData;
        this.resultsRepository = resultsRepository;
        this.roundsRepository = roundsRepository;
        this.cutCardPFRepository = cutCardPFRepository;
    }

    async getShoeVerification(roundId) {
        const round = await this.roundsRepository.findOne({ id: roundId }).lean().exec();
        const roundResult = await this.resultsRepository
            .findOne({ firstRoundId: { $lte: roundId }, lastRoundId: { $gte: roundId }, isAvailable: false }, { _id: false })
            .lean()
            .exec();
        const cutCardPF = await this.cutCardPFRepository
            .findOne({ roundId: roundResult?.firstRoundId }, { _id: false, time: false })
            .lean()
            .exec();

        if (round && roundResult) {
            const { burnedCards, cutCardIndex } = roundResult;
            const { cards, rawValue, hashValue } = this.decryptShoe(roundResult.shoe);
            const { usedCardIndexes } = round;

            return { shoeVerification: { cards, rawValue, hashValue, usedCardIndexes, burnedCards, cutCardIndex, cutCardPF } };
        }

        return { shoeVerification: {} };
    }

    decryptShoe({ encryptedShoe, encryptedShoeHash }) {
        const shoe = Helpers.CryptoHelper.decrypt(encryptedShoe);
        const hashValue = Helpers.CryptoHelper.decrypt(encryptedShoeHash);
        const cardString = shoe.split("_")[0];
        const cardValues = cardString.match(/10[♠♣♥♦]|[2-9JQKA][♠♣♥♦]/g);
        const cards = cardValues.map((card) => getCardFromString(card));

        return { cards, rawValue: shoe, hashValue };
    }

    generateShoe(cardsFromAdmin, randomMode) {
        const { CardChain, CryptoHelper, CardData } = Helpers;
        const cards = CardChain.updateCards(CardChain.generateCards(8, randomMode), cardsFromAdmin);

        const shoeString = cards
            .map((card) => `${CardData.name[card.rank]}${CardData.suit[card.suit]}`)
            .toString()
            .replaceAll(",", "");

        const rawValue = `${shoeString}_${CryptoHelper.randomString()}`;
        const hashValue = CryptoHelper.createHashSHA256(rawValue);
        const encryptedShoe = CryptoHelper.encrypt(rawValue);
        const encryptedShoeHash = CryptoHelper.encrypt(hashValue);

        return {
            cards,
            rawValue,
            hashValue,
            encryptedShoe,
            encryptedShoeHash,
        };
    }
}
