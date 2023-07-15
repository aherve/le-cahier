import type { LoaderFunction } from '@remix-run/node';
import type { AdminReport } from '~/schemas/admin-report';

import {
  Box,
  StackItem,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { authenticate, isAdmin } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const loader: LoaderFunction = async ({ request }) => {
  const authorized = await authenticate(request).then((user) =>
    isAdmin(user.username),
  );

  if (!authorized) {
    return redirect('/');
  }

  const report = await ChessBookService.adminReport();
  return json(report);
};

export default function Admin() {
  const report = useLoaderData<AdminReport>();

  const entries = Object.entries(report.usage).sort(
    (a, b) => b[1].positions - a[1].positions,
  );

  return (
    <>
      <VStack paddingTop="10">
        <StackItem>
          <Box>Total users: {report.totalUsers}</Box>
          <Box>Total users with moves: {entries.length}</Box>
        </StackItem>
        <TableContainer>
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>UserId</Th>
                <Th>Positions</Th>
                <Th>BookMoves</Th>
                <Th>OpponentMoves</Th>
                <Th>Comments</Th>
              </Tr>
            </Thead>
            <Tbody>
              {entries.map(
                ([
                  userId,
                  { positions, opponentMoves, bookMoves, comments },
                ]) => (
                  <Tr key={userId}>
                    <Td>{userId}</Td>
                    <Td>{positions}</Td>
                    <Td>{bookMoves}</Td>
                    <Td>{opponentMoves}</Td>
                    <Td>{comments}</Td>
                  </Tr>
                ),
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </VStack>
    </>
  );
}
