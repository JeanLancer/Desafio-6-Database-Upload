// import AppError from '../errors/AppError';

import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(transaction_id: string): Promise<void> {
    // TODO
    const transactionsRepository = getRepository(Transaction);

    await transactionsRepository.delete(transaction_id);
  }
}

export default DeleteTransactionService;
