USE [FloorballTraining_002]
GO

/****** Object:  StoredProcedure [dbo].[GenerateInsertStatements_ActivityEquipments]    Script Date: 14.03.2024 12:44:36 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[GenerateInsertStatements_ActivityEquipments]

AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
	@Id INT, 
	 @ActivityId int,
	 @EquipmentId int
      

    DECLARE cur CURSOR for SELECT
	[Id]
	  ,[ActivityId]
      ,[EquipmentId]
  FROM [dbo].[ActivityEquipments];

    OPEN cur;
    FETCH NEXT FROM cur INTO @Id, @ActivityId, @EquipmentId;
	print 'SET IDENTITY_INSERT [dbo].[ActivityEquipments] ON;';
	WHILE @@FETCH_STATUS = 0
    BEGIN
       Print ' INSERT INTO [dbo].[ActivityEquipments] ([Id],[ActivityId],[EquipmentId]) VALUES ('
			+ CAST(@Id AS NVARCHAR(10)) 
			+ ',' + CAST(@ActivityId AS NVARCHAR(10)) 
			+ ',' + CAST(@EquipmentId AS NVARCHAR(10)) 
			+');';		

        FETCH NEXT FROM cur INTO @Id, @ActivityId, @EquipmentId;
    END;
	   print 'SET IDENTITY_INSERT [dbo].[ActivityEquipments] OFF;'
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

