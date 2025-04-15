------------------------------------------------------------------
-- Initial check
------------------------------------------------------------------
DECLARE
    V_COUNT NUMBER;
BEGIN

    SELECT COUNT(1)
    INTO V_COUNT
    FROM DBA_TABLES
    WHERE OWNER = 'TMP_TABLE'
      AND UPPER(TABLE_NAME) LIKE UPPER('TFS106912_CONTR');

    IF V_COUNT > 0 THEN
        RAISE_APPLICATION_ERROR(-20666, 'SCRIPT WAS ALREADY EXECUTED ON THIS ENVIRONMENT.');
    END IF;
END;
/

------------------------------------------------------------------
-- Backup tables
------------------------------------------------------------------
CREATE TABLE TMP_TABLE.TFS106912_CONTR
AS
SELECT C.ID,
       C.DOCTYPE,
       C.DOCCD,
       C.DELICUSTCD AS CONSIGNEE,
       A.CUSTCD        "CONSIGNEEFROMADDRESS",
       C.DELIADDRCD    "DOCUMENTADDRESSCODE",
       (SELECT CAP.ADDRCD FROM CUSTADDR CAP WHERE CAP.CUSTCD=C.DELICUSTCD AND CAP.ISDELIADD=1 AND CAP.PRESEL=1) AS "NEWADDRESS",
       C.IDT
FROM CONTR C
         JOIN CUSTADDR A ON A.ADDRCD = C.DELIADDRCD
WHERE C.IDT>SYSDATE-120 
  AND C.DELICUSTCD <> A.CUSTCD;
/
------------------------------------------------------------------
-- REQUESTED CHANGES
------------------------------------------------------------------
DECLARE
    V_UBY    VARCHAR2(20)          := 'TFS106912';
    CURSOR C_CONTR IS SELECT * FROM TMP_TABLE.TFS106912_CONTR TMP;

    V_ROW C_CONTR%ROWTYPE;
BEGIN
    OPEN C_CONTR;

    LOOP
        FETCH C_CONTR INTO V_ROW;
        EXIT WHEN C_CONTR%NOTFOUND;

        -- Update the corresponding row in table B
        UPDATE CONTR C
        SET
            C.DELIADDRCD = V_ROW."NEWADDRESS",
            TIMESTAMP  = NVL(TIMESTAMP, 0) + 1,
            UBY        = V_UBY,
            UDT        = SYSDATE
        WHERE
            C.ID = V_ROW.ID;

    END LOOP;

    CLOSE C_CONTR;

    -- Commit the changes
    COMMIT;

EXCEPTION
    
    WHEN OTHERS THEN
        -- Handle exceptions
        DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
        ROLLBACK;
END;
/ 