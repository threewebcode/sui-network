import { useRpcClient } from '@mysten/core';
import { EventId } from '@mysten/sui.js';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { TableFooter } from '~/components/Table/TableFooter';
import { TxTableCol } from '~/components/transactions/TxCardUtils';
import { TxTimeType } from '~/components/tx-time/TxTimeType';
import { usePaginationStack } from '~/ui/Pagination';
import { PlaceholderTable } from '~/ui/PlaceholderTable';
import { TableCard } from '~/ui/TableCard';
import { Text } from '~/ui/Text';

interface EventsTableProps {
    initialLimit: number;
    disablePagination?: boolean;
    refetchInterval?: number;
}

export function EventsTable({
    initialLimit,
    disablePagination,
    refetchInterval,
}: EventsTableProps) {
    const rpc = useRpcClient();
    const [limit, setLimit] = useState(initialLimit);

    const countQuery = {data:20};
    const pagination = usePaginationStack<EventId>();

    const { data: eventsData } = useQuery(
        ['events', { limit, }],
        () =>
            rpc.queryEvents({
                query: {"All":[]},
                limit: 20,
                cursor: pagination.cursor,
                order: 'descending',             
            }),
        {
            keepPreviousData: true,
            refetchInterval: pagination.cursor ? undefined : refetchInterval,
        }
    );

    const eventsTable = useMemo(
        () =>
            eventsData
                ? {
                      data: eventsData?.data.map((event) => ({
                          id: (
                              <TxTableCol isHighlightedOnHover>
                                  <Text
                                      variant="bodySmall/medium"
                                      color="steel-darker"
                                  >
                                      {event.id.txDigest}
                                  </Text>
                              </TxTableCol>
                          ),

                          packageId: (
                              <TxTableCol>
                                  <Text
                                      variant="bodySmall/medium"
                                      color="steel-darker"
                                  >
                                      {event.packageId}
                                  </Text>
                              </TxTableCol>
                          ),                       
                          eventType: (
                              <TxTableCol>
                                  <Text
                                      variant="bodySmall/medium"
                                      color="steel-darker"
                                  >
                                      {event.type}
                                  </Text>
                              </TxTableCol>
                          ),
                          time: (
                            <TxTableCol>
                                <TxTimeType
                                    timestamp={+event.timestampMs}
                                />
                            </TxTableCol>
                          ),                           
                      })),
                      columns: [
                          {
                              header: 'Tx ID',
                              accessorKey: 'id',
                          },
                          {
                              header: 'Package ID',
                              accessorKey: 'packageId',
                          },
                          {
                              header: 'Event Type',
                              accessorKey: 'eventType',
                          },
                          {
                              header: 'Time',
                              accessorKey: 'time',
                          },                         
                      ],
                  }
                : null,
        [eventsData]
    );

    return (
        <div>
            {eventsTable ? (
                <TableCard
                    data={eventsTable.data}
                    columns={eventsTable.columns}
                />
            ) : (
                <PlaceholderTable
                    rowCount={+limit}
                    rowHeight="16px"
                    colHeadings={[
                        'Tx ID',
                        'Package ID',
                        'Time',
                        'Event Type',
                    ]}
                    colWidths={['100px', '120px', '204px', '90px', '38px']}
                />
            )}
            <div className="py-3">
                <TableFooter
                    label="Events"
                    data={eventsData}
                    count={+(countQuery.data ?? 0)}
                    limit={+limit}
                    onLimitChange={setLimit}
                    pagination={pagination}
                    disablePagination={disablePagination}
                    href="/recent?tab=events"
                />
            </div>
        </div>
    );
}
