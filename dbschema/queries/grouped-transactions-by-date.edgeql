WITH
  __param__pIds := <array<std::uuid>>$pIds,
  __param__cIds := <array<std::uuid>>$cIds,
  __param__lIds := <array<std::uuid>>$lIds,
  __param__isOverall := <std::bool>$isOverall,
  __param__tssDate := <OPTIONAL std::datetime>$tssDate,
  __param__tseDate := <OPTIONAL std::datetime>$tseDate
SELECT (WITH
  __transactions := (
    WITH
      __lid_set := std::array_unpack(__param__lIds),
      __cid_set := std::array_unpack(__param__cIds),
      __pid_set := std::array_unpack(__param__pIds),
    SELECT default::ETransaction {
      id
    }
    FILTER (
      .is_visible
      and
      (
        ((.<transaction[is ELoan].id union .<transaction[is EPayment].loan.id) in __lid_set)
        IF (exists __lid_set)
        ELSE (
          (
            __param__isOverall
            or (
              ((.date >= __param__tssDate) IF (exists __param__tssDate) ELSE true)
              and
              ((.date < __param__tseDate) IF (exists __param__tseDate) ELSE true)
            )
          )
          and
          ((.category.id in __cid_set) IF (exists __cid_set) ELSE true)
          and
          (
            (
              (
                (
                  false
                  IF (
                    (.source_partition.id in __pid_set)
                    and
                    ((.counterpart.source_partition.id union .<counterpart[is ETransaction].source_partition.id) in __pid_set)
                  )
                  ELSE (.source_partition.id in __pid_set)
                )
              )
              IF (.category.kind = ECategoryKind.Transfer)
              ELSE (.source_partition.id in __pid_set)
            )
            IF (exists __pid_set)
            ELSE (
              (
                false
                IF (
                  .is_visible
                  and
                  (.counterpart.is_visible union .<counterpart[is ETransaction].is_visible)
                )
                ELSE (
                  .is_visible
                )
              )
              IF (.category.kind = ECategoryKind.Transfer)
              ELSE true
            )
          )
        )
      )
    )
  ),
  __groups := (
    GROUP __transactions
    USING
      date_str := IF __param__isOverall THEN to_str(.date, "YYYY-MM") ELSE to_str(.date, "YYYY-MM-DD"),
      is_positive := (.value > <std::decimal>"0")
    BY date_str, is_positive
)
SELECT __groups {
  key: {
    date_str,
    is_positive
  },
  total := std::sum(.elements.value)
})
