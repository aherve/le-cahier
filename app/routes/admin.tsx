import type { LoaderFunction } from '@remix-run/node';
import type { AdminReport } from '~/schemas/admin-report';

import {
  Box,
  Table,
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
        <Box>
          <Box>Total users: {report.totalUsers}</Box>
          <Box>Total users with moves: {entries.length}</Box>
        </Box>
        <Table.Root variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>UserId</Table.ColumnHeader>
              <Table.ColumnHeader>Positions</Table.ColumnHeader>
              <Table.ColumnHeader>BookMoves</Table.ColumnHeader>
              <Table.ColumnHeader>OpponentMoves</Table.ColumnHeader>
              <Table.ColumnHeader>Comments</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {entries.map(
              ([
                userId,
                { positions, opponentMoves, bookMoves, comments },
              ]) => (
                <Table.Row key={userId}>
                  <Table.Cell>{userId}</Table.Cell>
                  <Table.Cell>{positions}</Table.Cell>
                  <Table.Cell>{bookMoves}</Table.Cell>
                  <Table.Cell>{opponentMoves}</Table.Cell>
                  <Table.Cell>{comments}</Table.Cell>
                </Table.Row>
              ),
            )}
          </Table.Body>
        </Table.Root>
      </VStack>
    </>
  );
}
