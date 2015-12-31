  var desktop = false;  // for desktop version, set desktop = true
  var desktopNotebookFileName = "demo.xml";  // relevant only when desktop = true
  var desktopTabWidth = 10000;  // relevant only when desktop = true
  
  var defaultTabWidth = 1000;
  var skipTimeout = 10;
  
  var currentTabEntryId;
  var previousTabEntryId;
  var currentModifyEntry;
  var previewing = false;
  var modified = false;
  var adding = '';
  var movePageSelectedEntryId = '';
  var searchIndex = 0;
  var newNotebookIsJustOpened = false;
  var lastFolderSelected;
  var tabWidthMap = {};
  var skip = false;
  
  $(document).on('pagecreate', '#mainPage', function() {

    // the btnMoveRight (>) button is clicked or tapped
    $("#mainPage").on('tap', '#btnMoveRight', function(event, ui) {
	  if (skip) { return; } 
	  var notebookFileName = $('#navbar a.current').attr('id');
	  var $target = $('#' + notebookFileName + 'Tab');
	  var moveAmount = $(window).width()-20;
	  var marginLeft = "-=" + moveAmount + "px";
      $target.animate({'marginLeft': marginLeft}, 1);	  
    });

    // the btnMoveLeft (<) button is clicked or tapped
    $("#mainPage").on('tap', '#btnMoveLeft', function(event, ui) {
	  var $target = $('#' + $('#navbar a.current').attr('id') + 'Tab');
	  var moveAmount = $(window).width()-20;
 	  var marginLeft = "0px";
	  if ($target.offset().left < -1 * moveAmount) {
	    marginLeft = "+=" + moveAmount + "px";
	  }
      $target.animate({'marginLeft': marginLeft}, 1);
    });
	
    // the btnNotebookMenu button is clicked or tapped
    $("#mainPage").on('tap', '#btnNotebookMenu', function(event, ui) {
      saveCurrentTabPosition();
      $('#notebookMenuPageHiddenLink').click();  // display "notebookMenuPage" as dialog
	  event.preventDefault();
  	  event.stopPropagation();
    });

    // the btnNewNotebook button is clicked or tapped
    $("#notebookMenuPage").on('tap', '#btnNewNotebook', function(event, ui) {
	  if (typeof lastFolderSelected == 'undefined')
		lastFolderSelected = null;
      file_Browser_params = {
        title : 'Select a directory',
        directory_browser : true,
        new_file_btn : false,
        new_folder_btn : false,
        initial_folder : lastFolderSelected,
        // callback function when a file is selected
        on_file_select : function(fileEntry) {
        },
        // callback function when a folder is selected
        on_folder_select : function(dirEntry) {
        },
        // callback function when the OK button is clicked or tapped
        on_ok : function(dirEntry, fileEntry) {
          lastFolderSelected = dirEntry;
          var fileName = prompt("Enter a file name", ".xml");
          if (fileName == null || fileName == '')
            return;
		  notebookFullPath = dirEntry.fullPath + '/' + fileName;
          checkIfFileExists(notebookFullPath, 
            function() {
			  alert('File already exists.');
            },
            function() {
		      var text = '<notebook xmlns="http://www.w3.org/1999/xhtml" nextEntryId="2" tabWidth="' + defaultTabWidth + '"><entry id="1"><title><![CDATA[]]></title><content><![CDATA[]]></content></entry></notebook>';
		      writeFile(notebookFullPath, text, function(){openNotebook(notebookFullPath);});
            }
          );
          window.history.go(-1);
        },
        // callback function when the Cancel button is clicked or tapped
        on_cancel : function (dirEntry) {
            window.history.go(-1);
        }            
      };
    });

    // the btnOpenNotebook button is clicked or tapped
    $("#notebookMenuPage").on('tap', '#btnOpenNotebook', function(event, ui) {
	  if (typeof lastFolderSelected == 'undefined')
		lastFolderSelected = null;
      file_Browser_params = {
        title : 'Select a notebook file',
        directory_browser : false,
        new_file_btn : false,
        new_folder_btn : false,
        initial_folder : lastFolderSelected,		
        // callback function when a file is selected
        on_file_select : function(fileEntry) {
        },
        // callback function when a folder is selected
        on_folder_select : function(dirEntry) {
        },
        // callback function when the OK button is clicked or tapped
        on_ok : function (dirEntry, fileEntry) {
          lastFolderSelected = dirEntry;
		  if (typeof fileEntry != 'undefined') {
			openNotebook(fileEntry.fullPath);
		  }
          window.history.go(-1);
        },
        // callback function when the Cancel button is clicked or tapped
        on_cancel : function (dirEntry) {
            window.history.go(-1);
        }            
      };
	  event.stopPropagation();
    });
    
    // the btnCloseNotebook button is clicked or tapped
    $("#notebookMenuPage").on('tap', '#btnCloseNotebook', function(event, ui) {
      var notebookFileName = getNotebookFileName(currentTabEntryId);
      closeTab($('#' + notebookFileName + 'Tab'), $('#' + notebookFileName), notebookFileName);
      window.history.go(-1);
    });

    // the btnXslt button is clicked or tapped
    $("#notebookMenuPage").on('tap', '#btnXslt', function(event, ui) {
      if ((typeof currentTabEntryId == 'undefined') || (currentTabEntryId === null)) {
        alert('No notebook is opened.');
      }
      else {
        var notebookFileName = getNotebookFileName(currentTabEntryId);
        var notebookFullPath = $('#' + notebookFileName).data('fullpath');
		if (notebookFullPath.indexOf('/') == 0) {
			notebookFullPath = notebookFullPath.slice(1);
		}
        var defaultXslFullPath = getFileBasePath(notebookFullPath, false) + '/default.xsl';
        // if a file named "default.xsl" exists in the same directory as the notebook file, use it
        checkIfFileExists(defaultXslFullPath, 
          function() {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'xsltResult']);
            $('#xsltResult').xslt({xmlUrl: notebookFullPath, xslUrl: defaultXslFullPath, xmlCache: false, xslCache: false});
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'xsltResult']);      
          },
          function() {
            // do nothing
          }
        );
        // display "xsltPage"
        $('#xsltPageHiddenLink').click();      
      }    
    });

    // the btnXslt button is clicked or tapped
    $("#xsltPage").on('tap', '#btnOpenXslt', function(event, ui) {    
      if ((typeof currentTabEntryId == 'undefined') || (currentTabEntryId === null)) {
        alert('No notebook is opened.');
      }
      else {
        if (typeof lastFolderSelected == 'undefined')
			lastFolderSelected = null;
		file_Browser_params = {
			title : 'Select an XSL file',
			directory_browser : false,
			new_file_btn : false,
			new_folder_btn : false,
			initial_folder : lastFolderSelected,		
			// callback function when a file is selected
			on_file_select : function(fileEntry) {
			},
			// callback function when a folder is selected
			on_folder_select : function(dirEntry) {
			},
			// callback function when the OK button is clicked or tapped
			on_ok : function (dirEntry, fileEntry) {
			  lastFolderSelected = dirEntry;
			  if (typeof fileEntry != 'undefined') {
				var notebookFileName = getNotebookFileName(currentTabEntryId);
				var notebookFullPath = $('#' + notebookFileName).data('fullpath');
				if (notebookFullPath.indexOf('/') == 0) {
					notebookFullPath = notebookFullPath.slice(1);
				}
				var defaultXslFullPath = fileEntry.fullPath;
				if (defaultXslFullPath.indexOf('/') == 0) {
					defaultXslFullPath = defaultXslFullPath.slice(1);
				}		
				MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'xsltResult']);
				$('#xsltResult').xslt({xmlUrl: notebookFullPath, xslUrl: defaultXslFullPath, xmlCache: false, xslCache: false});
				MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'xsltResult']);
			  }
			  window.history.go(-1);
			},
			// callback function when the Cancel button is clicked or tapped
			on_cancel : function (dirEntry) {
				window.history.go(-1);
			}            
		};
      };
	  event.stopPropagation();
    });

	// btnSetTabWidth is clicked or tapped
    $("#notebookMenuPage").on('tap', '#btnSetTabWidth', function(event, ui) {
      if ((typeof currentTabEntryId == 'undefined') || (currentTabEntryId === null)) {
        alert('No notebook is opened.');
      }
      else {
	    var notebookFileName = getNotebookFileName(currentTabEntryId);
	    var tabWidth = getTabWidth(notebookFileName);
	    tabWidth = prompt("Enter width", tabWidth);
		if (tabWidth) {
	      // save tabWidth in xml
	      var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());
	      $notebook = $(xmlDoc).find('notebook')[0];
		  if (!isNaN(tabWidth)) {
	        $notebook.setAttribute("tabWidth", parseInt(tabWidth,10));
		    tabWidthMap[notebookFileName] = tabWidth;
	        // save the xml string in cache textarea
	        $('#txtCache-' + notebookFileName).text((new XMLSerializer()).serializeToString(xmlDoc));
	        saveNotebook(notebookFileName);
	        // set to new width
	        $('#' + notebookFileName + 'Tab .entry').width(getTabWidth(notebookFileName)).collapsible();		
		  }			
		}
		window.history.go(-1);
	  }
	});
	
    // a tab is clicked or tapped
    $('#mainPage').on('tap', '#navbar a', function(event, ui) {
      var $this = $(this);
      showTab($('#' + $this.attr('id') + 'Tab'), $this);
    });

	// an entry is clicked or tapped
    $('#mainPage').on('tap collapsibleexpand collapsiblecollapse', '.entry', function(event, ui) {
//    $('#mainPage').on('tap', '.entry', function(event, ui) {
      currentTabEntryId = $(this).attr('id');
	  event.stopPropagation();
    });
	
    // the btnEntryMenu button is clicked or tapped
    $("#mainPage").on('tap', '#btnEntryMenu', function(event, ui) {
      if ((typeof currentTabEntryId == 'undefined') || (currentTabEntryId === null)) {
        alert('No notebook is opened.');
      }
      else {
	    saveCurrentTabPosition();
        $('#entryMenuPageHiddenLink').click();  // display "entryMenuPage" as dialog
	  }
 	  event.preventDefault();
  	  event.stopPropagation();
    });
    
    // the btnModifyEntry button is clicked or tapped
    $('#entryMenuPage').on('tap', '#btnModifyEntry', function(event, ui) {
      var titleAndContent = getTitleAndContent(getNotebookFileName(currentTabEntryId), getEntryId(currentTabEntryId));
      $('#txtModifyEntryTitle').val(titleAndContent.title);
      $('#txtModifyEntryContent').val(titleAndContent.content);
      previewing = false;
      modified = false;
	  $("#btnCancelEntryModification").text("Back");
      $('#btnPreview').text('Preview');
	  $('#modifyEntryPageFooter').show();
      $('#btnModifyEntryTitle').trigger('tap');
      $('#modifyEntryPageHiddenLink').click();  // display "modifyEntryPage"
    });

    // set the active status of the buttons of modifyEntryPage
    function setModifyEntryPageButtonStatus() {
      $('#btnSaveEntry').removeClass('ui-btn-active');
      $('#btnCancelEntryModification').removeClass('ui-btn-active');
      $('#btnPreview').removeClass('ui-btn-active');
      if (currentModifyEntry == 'title') {
        $('#btnModifyEntryContent').removeClass('ui-btn-active');
        $('#btnModifyEntryTitle').addClass('ui-btn-active');          
      }
      else if (currentModifyEntry == 'content') {
        $('#btnModifyEntryTitle').removeClass('ui-btn-active');
        $('#btnModifyEntryContent').addClass('ui-btn-active');      
      }
    };

    // one of the shortcut key buttons is clicked or tapped
    $('#modifyEntryPage').on('tap', '.modifyEntryPageShortcutKeyBar a', function(event, ui) {
      $(this).removeClass('ui-btn-active');
      var key = $(this).text();
	  if (key == '>') { key = '\\gt'; }
	  if (key == '<') { key = '\\lt'; }
      var txtAreaId;
      if (currentModifyEntry == 'title') {
        txtAreaId = 'txtModifyEntryTitle';
      }
      else if (currentModifyEntry == 'content') {
        txtAreaId = 'txtModifyEntryContent';
      }
      var txtAreaText = $('#' + txtAreaId).val();
      var caretPos = document.getElementById(txtAreaId).selectionStart;
      $('#' + txtAreaId).val(txtAreaText.substring(0, caretPos) + key + txtAreaText.substring(caretPos));
      setCaretToPos(document.getElementById(txtAreaId), caretPos + key.length);
    });
    
    // the btnModifyEntryTitle button is clicked or tapped
    $('#modifyEntryPage').on('tap', '#btnModifyEntryTitle', function(event, ui) {
      currentModifyEntry = 'title';
      setModifyEntryPageButtonStatus();
      if (previewing) {
        showPreview('title');
      }
      else {
        $('#modifyEntryTitleTab').show();
        $('#modifyEntryContentTab').hide();
		$('#modifyEntryPreviewTab').hide();
      }
    });
    
    // the btnModifyEntryContent button is clicked or tapped
    $('#modifyEntryPage').on('tap', '#btnModifyEntryContent', function(event, ui) {
      currentModifyEntry = 'content';
      setModifyEntryPageButtonStatus();
      if (previewing) {
        showPreview('content');
      }
      else {
        $('#modifyEntryContentTab').show();
        $('#modifyEntryTitleTab').hide();
		$('#modifyEntryPreviewTab').hide();
      }
    });

    // the btnSaveEntry button is clicked or tapped
    $('#modifyEntryPage').on('tap', '#btnSaveEntry', function(event, ui) {
      setModifyEntryPageButtonStatus();
      var notebookFileName = getNotebookFileName(currentTabEntryId);
      var entryId = getEntryId(currentTabEntryId);
      if (adding == 'append') {
        // create and return a new collapsible item for an entry
        if ($('#' + previousTabEntryId + ' [data-role="collapsible"]').length == 0) {
          $('#' + previousTabEntryId + 'c').after(createEntry(notebookFileName, entryId));      
        }
        else {
          $('#' + previousTabEntryId + 'c').parent().append(createEntry(notebookFileName, entryId));
        }
        $('#' + currentTabEntryId).collapsible();
        adding = '';
      }
      else if (adding == 'next') {
        $('#' + previousTabEntryId).after(createEntry(notebookFileName, entryId));
        $('#' + currentTabEntryId).collapsible();
        adding = '';
      }
      var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());
      var entryElement = $(xmlDoc).find('entry[id="' + entryId + '"]')[0];
      var titleElement = $(entryElement).find('title')[0];
      if (typeof titleElement == 'undefined') {
        titleElement = xmlDoc.createElement("title");
        entryElement.appendChild(titleElement);  
      }
      var cdataElementTitle = xmlDoc.createCDATASection($('#txtModifyEntryTitle').val());
      if (titleElement.childNodes.length > 0) {
        titleElement.removeChild(titleElement.childNodes[0]);
      }
      titleElement.appendChild(cdataElementTitle);
      var contentElement = $(entryElement).find('content')[0];
      if (typeof contentElement == 'undefined') {
        contentElement = xmlDoc.createElement("content");
        entryElement.appendChild(contentElement);  
      }
      var cdataElementContent = xmlDoc.createCDATASection($('#txtModifyEntryContent').val());
      if (contentElement.childNodes.length > 0) {
        contentElement.removeChild(contentElement.childNodes[0]);
      }
      contentElement.appendChild(cdataElementContent);      
      $('#txtCache-' + notebookFileName).text((new XMLSerializer()).serializeToString(xmlDoc));
	  saveNotebook(notebookFileName);
      var id = notebookFileName + '-' + entryId;
      $('#' + id + 't div').text(cdataElementTitle.nodeValue);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, id + 't']);
      $('#' + id + 'c').text(cdataElementContent.nodeValue);      
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, id + 'c']);
      modified = false;
	  $("#btnCancelEntryModification").text("Back");
    });

    // the btnCancelEntryModification button is clicked or tapped
    $('#modifyEntryPage').on('tap', '#btnCancelEntryModification', function(event, ui) {
      if (modified) {
        $('#cancelWithoutSaveConfirmationDialogHiddenLink').click();      
      }
      else {
        modified = false;
		$("#btnCancelEntryModification").text("Back");
        if ((adding == 'append') || (adding == 'next')) {
          removeNewXmlEntry();        
        }
        adding = '';
        window.history.go(-2);
      }
  	  event.preventDefault();
  	  event.stopPropagation();
    });

    // the btnCancelWithoutSaveConfirmationYes button is clicked or tapped
    $('#btnCancelWithoutSaveConfirmationYes').on('tap', function() {
      modified = false;
	  $("#btnCancelEntryModification").text("Back");
      if ((adding == 'append') || (adding == 'next')) {
        removeNewXmlEntry();        
      }
      adding = '';
      window.history.go(-3);
    });
    
    // the btnPreview button is clicked or tapped
    $('#modifyEntryPage').on('tap', '#btnPreview', function(event, ui) {
      setModifyEntryPageButtonStatus();
      if ($('#btnPreview').text() == 'Preview') {
        previewing = true;
        $('#btnPreview').text('Modify');
        showPreview(currentModifyEntry);
		$('#modifyEntryPageFooter').hide();
      }
      else {
        previewing = false;
        if (currentModifyEntry == 'title') {
          $('#btnModifyEntryTitle').trigger('tap');
        }
        else if (currentModifyEntry == 'content') {
          $('#btnModifyEntryContent').trigger('tap');     
        }
        $('#btnPreview').text('Preview');
		$('#modifyEntryPageFooter').show();
      }
    });
    
    function showPreview(modifyEntry) {
      if (currentModifyEntry == 'title') {
        $('#modifyEntryPreviewTab').text($('#txtModifyEntryTitle').val());
      }
      else if (currentModifyEntry == 'content') {
        $('#modifyEntryPreviewTab').text($('#txtModifyEntryContent').val());      
      }
	  $('#modifyEntryPreviewTab').css('min-height', $('#modifyEntryPage').height()-$('#modifyEntryPageHeader').height()-$('#modifyEntryPageFooter').height());	
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'modifyEntryPreviewTab']);
      $('#modifyEntryTitleTab').hide();
      $('#modifyEntryContentTab').hide();          
      $('#modifyEntryPreviewTab').show();
    };
    
    // when user inputs in the txtModifyEntryTitle textarea 
    $('#modifyEntryPage').on('input', '#txtModifyEntryTitle', function(event, ui) {
      modified = true;
	  $("#btnCancelEntryModification").text("Cancel");
    });

    // when user inputs in the txtModifyEntryContent textarea 
    $('#modifyEntryPage').on('input', '#txtModifyEntryContent', function(event, ui) {
      modified = true;
	  $("#btnCancelEntryModification").text("Cancel");
    });
    
    // the btnAddChildEntry button is clicked or tapped
    $('#entryMenuPage').on('tap', '#btnAddChildEntry', function(event, ui) {
      var nextEntryId = createNewXmlEntry('append');
      var notebookFileName = getNotebookFileName(currentTabEntryId);
      previousTabEntryId = notebookFileName + '-' + getEntryId(currentTabEntryId);      
      currentTabEntryId = notebookFileName + '-' + nextEntryId;      
      adding = 'append';
      $('#btnModifyEntry').trigger('tap');
    });

    // the btnAddNextEntry button is clicked or tapped
    $('#entryMenuPage').on('tap', '#btnAddNextEntry', function(event, ui) {
      var nextEntryId = createNewXmlEntry('next');
      var notebookFileName = getNotebookFileName(currentTabEntryId);
      previousTabEntryId = notebookFileName + '-' + getEntryId(currentTabEntryId);      
      currentTabEntryId = notebookFileName + '-' + nextEntryId;      
      adding = 'next';
      $('#btnModifyEntry').trigger('tap');
    });

    // the btnDeleteEntry button is clicked or tapped
    $('#entryMenuPage').on('tap', '#btnDeleteEntry', function(event, ui) {
      $('#deleteConfirmationDialogHiddenLink').click();
	  event.preventDefault();
  	  event.stopPropagation();
    });

    // the deleteConfirmationYes button is clicked or tapped
    $('#btnDeleteConfirmationDialogYes').on('tap', function() {
      var removedXmlEntry = removeXmlEntry();
      removeHtmlEntry(removedXmlEntry);
      window.history.go(-2);
	  event.preventDefault();
  	  event.stopPropagation();	  
    });

    // the btnMoveBefore button is clicked or tapped
    $('#entryMenuPage').on('tap', '#btnMoveBefore', function(event, ui) {
      movePageSelectedEntryId = '';
      buildSiblingListview('moveBeforeSelection');
      $('#moveBeforePageHiddenLink').click();  // display "moveBeforePage"
      $('#moveBeforeSelection').listview("refresh");
    });

    // the btnMoveAfter button is clicked or tapped
    $('#entryMenuPage').on('tap', '#btnMoveAfter', function(event, ui) {
      movePageSelectedEntryId = '';
      buildSiblingListview('moveAfterSelection');
      $('#moveAfterPageHiddenLink').click();  // display "moveAfterPage"
      $('#moveAfterSelection').listview("refresh");
    });

    // the btnMoveDown button is clicked or tapped
    $('#entryMenuPage').on('tap', '#btnMoveDown', function(event, ui) {
      movePageSelectedEntryId = '';
      buildSiblingListview('moveDownSelection');
      $('#moveDownPageHiddenLink').click();  // display "moveDownPage"
      $('#moveDownSelection').listview("refresh");
    });

    // an item in moveBeforeSelection is clicked or tapped
    $('#moveBeforePage').on('tap', '#moveBeforeSelection li', function(e) {
        if ($(this).attr('data-name') != getEntryId(currentTabEntryId)) {
          $('#moveBeforeSelection li').css('background-color', '');
          $(this).css('background-color', '#aaa');
          movePageSelectedEntryId = $(this).attr('data-name');        
        }
    });

    // an item in moveDownSelection is clicked or tapped
    $('#moveAfterPage').on('tap', '#moveAfterSelection li', function(e) {
        if ($(this).attr('data-name') != getEntryId(currentTabEntryId)) {
          $('#moveAfterSelection li').css('background-color', '');
          $(this).css('background-color', '#aaa');
          movePageSelectedEntryId = $(this).attr('data-name');        
        }
    });
    
    // an item in moveDownSelection is clicked or tapped
    $('#moveDownPage').on('tap', '#moveDownSelection li', function(e) {
        if ($(this).attr('data-name') != getEntryId(currentTabEntryId)) {
          $('#moveDownSelection li').css('background-color', '');
          $(this).css('background-color', '#aaa');
          movePageSelectedEntryId = $(this).attr('data-name');        
        }
    });

    // the btnMoveBefore button is clicked or tapped
    $('#moveBeforePage').on('tap', '#btnMoveBefore', function(e) {
      var notebookFileName = getNotebookFileName(currentTabEntryId);
      var entryId = getEntryId(currentTabEntryId);
      var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());    
      var currentEntryElement = $(xmlDoc).find('entry[id="' + entryId + '"]')[0];
      var beforeElement = $(xmlDoc).find('entry[id="' + movePageSelectedEntryId + '"]')[0];  // add before this element  
      currentEntryElement.parentNode.insertBefore(currentEntryElement, beforeElement);
      $('#' + notebookFileName + "-" + movePageSelectedEntryId).before($('#' + notebookFileName + "-" + entryId));
      $('#' + notebookFileName + "-" + entryId).collapsible();      
      // save the xml string in cache textarea
      $('#txtCache-' + notebookFileName).text((new XMLSerializer()).serializeToString(xmlDoc));
	  saveNotebook(notebookFileName);
      window.history.go(-2);
    });
    
    // the btnMoveToAfter button is clicked or tapped
    $('#moveAfterPage').on('tap', '#btnMoveAfter', function(e) {
      var notebookFileName = getNotebookFileName(currentTabEntryId);
      var entryId = getEntryId(currentTabEntryId);
      var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());    
      var currentEntryElement = $(xmlDoc).find('entry[id="' + entryId + '"]')[0];
      var afterElement = $(xmlDoc).find('entry[id="' + movePageSelectedEntryId + '"]')[0];  // add after this element  
      currentEntryElement.parentNode.insertBefore(currentEntryElement, afterElement.nextSibling);
      $('#' + notebookFileName + "-" + movePageSelectedEntryId).after($('#' + notebookFileName + "-" + entryId));
      $('#' + notebookFileName + "-" + entryId).collapsible();      
      // save the xml string in cache textarea
      $('#txtCache-' + notebookFileName).text((new XMLSerializer()).serializeToString(xmlDoc));
	  saveNotebook(notebookFileName);
      window.history.go(-2);
    });
    
    // the btnMoveToChild button is clicked or tapped
    $('#moveDownPage').on('tap', '#btnMoveToChild', function(e) {
      var notebookFileName = getNotebookFileName(currentTabEntryId);
      var entryId = getEntryId(currentTabEntryId);
      var tabEntryId = notebookFileName + '-' + entryId;
      var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());    
      var currentEntryElement = $(xmlDoc).find('entry[id="' + entryId + '"]')[0];
      var appendToEntryElement = $(xmlDoc).find('entry[id="' + movePageSelectedEntryId + '"]')[0]; // add after the last child of this element
      appendToEntryElement.appendChild(currentEntryElement);
      $('#' + notebookFileName + "-" + movePageSelectedEntryId + 'c').parent().append($('#' + notebookFileName + "-" + entryId));
      $('#' + notebookFileName + "-" + movePageSelectedEntryId).collapsible();      
      // save the xml string in cache textarea
      $('#txtCache-' + notebookFileName).text((new XMLSerializer()).serializeToString(xmlDoc));
	  saveNotebook(notebookFileName);
      window.history.go(-2);
    });
    
    $('#moveBeforePage').on('tap', '#btnCancelMoveBefore', function(e) {
	  skip = true;
	  setTimeout(function(){ skip = false; }, skipTimeout);
      window.history.go(-2);
    });

    $('#moveAfterPage').on('tap', '#btnCancelMoveAfter', function(e) {
	  skip = true;
	  setTimeout(function(){ skip = false; }, skipTimeout);
      window.history.go(-2);
    });

    $('#moveDownPage').on('tap', '#btnCancelMoveDown', function(e) {
	  skip = true;
	  setTimeout(function(){ skip = false; }, skipTimeout);
      window.history.go(-2);
    });

    // the btnSearch button is clicked or tapped
    $("#mainPage").on('tap', '#btnSearch', function(event, ui) {
      if ((typeof currentTabEntryId == 'undefined') || (currentTabEntryId === null)) {
        alert('No notebook is opened.');
      }
      else {
        var searchText = $('#txtSearch').val();
        if (searchText != '') {
          var result = search(searchText, searchIndex);
          if (result.total > 0) { // found
            var tabEntryId = getNotebookFileName(currentTabEntryId) + '-' + result.entryId;
            goTo(tabEntryId);
            if (searchIndex < result.total-1) {
              searchIndex++;
            }
            else {
              searchIndex = 0;
            }
          }
          else {
            alert('Not found.');
          }
        }
	  }
    });

    // user inputs in txtSearch
    $("#mainPage").on('input', '#txtSearch', function(event, ui) {
      searchIndex = 0;
    });

    // the btnExpand button is clicked or tapped
    $('#entryMenuPage').on('tap', '#btnExpand', function(event, ui) {
      $('#' + currentTabEntryId).collapsible("option", "collapsed", false);
      $('#' + currentTabEntryId + ' [data-role="collapsible"]').collapsible("option", "collapsed", false);
      window.history.go(-1);
    });

    // the btnCollapse button is clicked or tapped
    $('#entryMenuPage').on('tap', '#btnCollapse', function(event, ui) {
      $('#' + currentTabEntryId).collapsible("option", "collapsed", true);
      $('#' + currentTabEntryId + ' [data-role="collapsible"]').collapsible("option", "collapsed", true);    
      window.history.go(-1);
    });
    
    // show or hide the testing elements
    if (desktop) {
	  $('#btnNotebookMenu').hide();
      $('#txtTest').hide();
      $('#btnTest').hide();      
    }
    else {
      $('#txtTest').hide();
      $('#btnTest').hide();    
    }
    
    // initialize "lastFolderSelected"
    if (typeof lastFolderSelected == 'undefined') {
        lastFolderSelected = null;    
    }

      // to be modified 
      // >>>
	  if (desktop) {

		  openNotebook("./" + desktopNotebookFileName);
          
          $("#mainPage").on('tap', '#btnTest', function(event, ui) {
            $('#txtTest').val($('#xmlTab').html());
          });
	  }
      // <<<
      
  });
  
  $(document).on('pageshow', '#mainPage', function() {
    if (newNotebookIsJustOpened) {
      newNotebookIsJustOpened = false;
      $(window).scrollTop(0);      
    }
    else {
	  var $a = $('#navbar a.current');
	  if ($a.length == 1) {
		$(window).scrollTop($a.attr('scrollTop'));      
	  }
    }
  });
  
  $(document).on('pageshow', '#modifyEntryPage', function() {
      var height = $(window).height()/2-$('#txtModifyEntryTitle').offset().top-$('#modifyEntryPageFooter').height();
      $('#txtModifyEntryTitle').height(height);
      $('#txtModifyEntryContent').height(height);
  });
  
  // open an existing notebook in a new tab
  function openNotebook(notebookFullPath) {
	if (desktop) {
		$.ajax({
		  type: "GET",
		  url: notebookFullPath,
		  dataType: "xml",
		  success: function(xmlData) {
			var $xmlDoc = $(xmlData);
			displayNotebook($xmlDoc, xmlData, notebookFullPath);
			var notebookFileName = getFileName(notebookFullPath, false);
			$('#txtCache-' + notebookFileName).text((new XMLSerializer()).serializeToString(xmlData));
		  }
		});		
	}
	else {
		readFile(notebookFullPath, function(xmlData) {
		  var xmlDoc = $.parseXML(xmlData);
		  var $xmlDoc = $(xmlDoc);
		  displayNotebook($xmlDoc, xmlData, notebookFullPath);
		});		
	}
  };
  
  // get the title and content of an entry in a notebook
  function getTitleAndContent(notebookFileName, entryId) {
    var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());
    var title = "";
    var titleElement = $(xmlDoc).find('entry[id="' + entryId + '"] title')[0];
    if (typeof titleElement != 'undefined') {
      if (titleElement.childNodes.length > 0) {
        title = titleElement.childNodes[0].nodeValue;
      }
    }
    var content = "";
    var contentElement = $(xmlDoc).find('entry[id="' + entryId + '"] content')[0];    
    if (typeof contentElement != 'undefined') {
      if (contentElement.childNodes.length > 0) {
        content = contentElement.childNodes[0].nodeValue;    
      }
    }
    return { title: title, content: content };
  };

  // display a specific tab
  function showTab($tab, $a) {
    saveCurrentTabPosition();
    $tab.show().siblings('.tab').hide();  // show current tab only
    $a.parent().siblings('li').children('a').removeClass('ui-btn-active').removeClass('ui-state-persist').removeClass('current');
    $a.addClass('ui-btn-active').addClass('ui-state-persist').addClass('current');
    $(window).scrollTop($a.attr('scrollTop'));
//console.log('showTab:' + $a.attr('id') + ',' + $a.attr('scrollTop'));    
    if (typeof $a.attr('currentTabEntryId') != 'undefined') {
      currentTabEntryId = $a.attr('currentTabEntryId');
    }
  };
  
  // close a specific tab
  function closeTab($tab, $a, notebookFileName) {
 	delete tabWidthMap[notebookFileName];
    $('#navbar').navbar("destroy");
    $a.parent().remove();   // remove the <li>
    if ($('#navbar li').length == 0) { $('#navbar ul').append('<li id="dummyLi"></li>'); };
    $('#navbar').navbar();
    $tab.remove();   // remove the tab content
    if ($('#navbar a').length > 0) {
      $('#navbar a:first').trigger('tap');
    }
    else {
      currentTabEntryId = null;
    }
  };

  // save the scrolling position of the current tab to the "scrollTop" attribute of the tab button
  function saveCurrentTabPosition() {
    var scrollTop = 0;
    var currentTabButtonId = getCurrentTabButtonId();
    if (typeof currentTabButtonId != 'undefined') {
      scrollTop = $(window).scrollTop();
      $('#' + currentTabButtonId).attr('scrollTop', scrollTop);
      $('#' + currentTabButtonId).attr('currentTabEntryId', currentTabEntryId);
    }
//console.log('save:' + currentTabButtonId + ',' +  scrollTop);   
  };

  // return the id of the current tab button (i.e. notebook file name)
  function getCurrentTabButtonId() {
    return $('#navbar .current').attr('id');
  };

  // return the notebookFileName based on tab entry id
  function getNotebookFileName(tabEntryId) {
    return tabEntryId.substring(0, tabEntryId.lastIndexOf('-'));
  };

  // return the entry id based on tab entry id
  function getEntryId(tabEntryId) {
    var entryId = tabEntryId.substring(tabEntryId.lastIndexOf('-')+1);
    if (entryId == 'null') {
      var firstTabEntryId = $('#' + getNotebookFileName(tabEntryId) + 'Tab .entry:first').attr('id');
      entryId = firstTabEntryId.substring(firstTabEntryId.lastIndexOf('-')+1);
    }
    return entryId;
  };

  // log a message
  function log(s) {
    $('#log').html($('#log').html() + '<br/>' + s);
  };
  
  // format and display the content of an xml document object in a new tab
  function displayNotebook($xmlDoc, xmlData, notebookFullPath) {
    var notebookFileName = getFileName(notebookFullPath, false);
    if ($('#navbar a:contains(' + notebookFileName + ')').length > 0) {
      alert('Notebook "' + notebookFileName + '" already opened.');
    }
    else {
      // get the root node, i.e. <notebook>
      var rootNode = $xmlDoc.find("notebook");
          
      // create a new tab
      $('#navbar').find("*").andSelf().each(function() {  // remove the JQM auto-init classes
        $(this).removeClass(function(i, cn){
          var matches = cn.match (/ui-[\w\-]+/g) || [];
          return (matches.join (' '));
        });
        if ($(this).attr("class") == "") {
          $(this).removeAttr("class");
        }
      });
      $('#navbar').navbar("destroy");
      $('#navbar a').removeClass('current');
      $('#navbar ul').append('<li><a id="' + notebookFileName + '" href="#" data-role="button" rel="external" class="current" data-fullpath="' + notebookFullPath + '">' + notebookFileName + '</a></li>');
      var tabHtml = '<div id="' + notebookFileName + 'Tab" class="tab"><textarea id="txtCache-' + notebookFileName + '" data-autogrow="false" rows="2"';
      if (!desktop) {
        tabHtml += ' style="display: none"';
      }
      tabHtml += '></textarea></div>';
      $('#tabs').append(tabHtml);
      if ($('#dummyLi').length) { $('#dummyLi').remove(); };
      $('#navbar').navbar();
      $('#txtCache-' + notebookFileName).text(xmlData);
	  if (desktop) {
	    $('#txtCache-' + notebookFileName).width($(window).width());
		$('#' + notebookFileName + 'Tab').prepend('<div style="color:red">Before closing the browser: Copy the text below and save it manually!</div>');
	  }
	  
      // construct the collapsible from the xml
      $.each(rootNode, function(key, value) {    
        getEntry(value, $('#' + notebookFileName + 'Tab'), notebookFileName);
      });
      $('[data-role="collapsible"]').collapsible();
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, notebookFileName + 'Tab']);
      
      // set currentTabEntryId to refer to the first entry 
      currentTabEntryId = $('#' + notebookFileName + 'Tab .entry:first').attr('id');
      // scroll to top
      $(window).scrollTop(0);
      // display the tab
      showTab($('#' + notebookFileName + 'Tab'), $('#' + notebookFileName));
      newNotebookIsJustOpened = true;      
    }
  };
  
  // a recursive function used by "displayNotebook"
  /*
      <div class="entry" id=(notebookFileName)-(entryId) ...>
         <h3 id=(notebookFileName)-(entryId)t ...><div class="title" ...>
         <p  id=(notebookFileName)-(entryId)c class="content" ...>         
  */
  function getEntry(node, $div, idPrefix) {
    if (node.childNodes.length > 0) {
      for (var i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].nodeName == "entry") {
          $div2 = createEntry(idPrefix, node.childNodes[i].getAttribute('id')).appendTo($div);
          getEntry(node.childNodes[i], $div2, idPrefix);
        }
        else if (node.childNodes[i].nodeName == "title") {
          if (node.childNodes[i].childNodes.length > 0) {
            $('#' + $div.attr('id') + 't div').text(node.childNodes[i].childNodes[0].nodeValue);
          }
        }
        else if (node.childNodes[i].nodeName == "content") {
          if (node.childNodes[i].childNodes.length > 0) {
            $('#' + $div.attr('id') + 'c').text(node.childNodes[i].childNodes[0].nodeValue);
          }
        }
      }
    }  
  };
  
  // create and return a new collapsible item for an entry
  function createEntry(notebookFileName, entryId) {
    var id = notebookFileName + '-' + entryId;
    // entry
    var $entry = $('<div class="entry" data-role="collapsible" id="' + id + '"></div>').width(getTabWidth(notebookFileName));
    // title
    $entry.append('<h3 id="' + id + 't"><div class="title"></div></h3>');
    // content
    $entry.append('<p id="' + id + 'c" class="content"></p>');
    return $entry;
  };

  // create a new entry in xml
  function createNewXmlEntry(addType) {
    var notebookFileName = getNotebookFileName(currentTabEntryId);
    // retrieve the value of the "nextEntryId" attribute in a notebook
    var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());
    $notebook = $(xmlDoc).find('notebook')[0];
    var nextEntryId = 1;
    if (addType != 'first') {
      nextEntryId = $notebook.getAttribute("nextEntryId");
    }
    // add 1 to the nextEntryId
    $notebook.setAttribute("nextEntryId", parseInt(nextEntryId,10)+1);    
    // create a new entry in xmlDoc
    var entry = xmlDoc.createElement("entry");
    entry.setAttribute("id", nextEntryId);
    var entryTitle = xmlDoc.createElement("title");
    entry.appendChild(entryTitle);  
    var entryTitleCdata = xmlDoc.createCDATASection("");
    entryTitle.appendChild(entryTitleCdata);
    var entryContent = xmlDoc.createElement("content");
    entry.appendChild(entryContent);  
    var entryContentCdata = xmlDoc.createCDATASection("");
    entryContent.appendChild(entryContentCdata);
    if (addType == 'append') {
      $(xmlDoc).find('entry[id="' + getEntryId(currentTabEntryId) + '"]')[0].appendChild(entry);      
    }
    else if (addType == 'next') {
      var currentElement = $(xmlDoc).find('entry[id="' + getEntryId(currentTabEntryId) + '"]')[0];
      currentElement.parentNode.insertBefore(entry, currentElement.nextSibling);          
    }
    else if (addType == 'first') {
      $notebook.appendChild(entry);          
    }
    // save the xml string in cache textarea
    $('#txtCache-' + notebookFileName).text((new XMLSerializer()).serializeToString(xmlDoc));
	saveNotebook(notebookFileName);
    // return the nextEntryId
    return nextEntryId;
  };
  
  // remove the new entry (and its children) in xml
  function removeNewXmlEntry() {
    var notebookFileName = getNotebookFileName(currentTabEntryId);
    var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());
    $notebook = $(xmlDoc).find('notebook')[0];
    var nextEntryId = $notebook.getAttribute("nextEntryId");
    var entryId = parseInt(nextEntryId,10)-1;
    $notebook.setAttribute("nextEntryId", entryId);      
    $($(xmlDoc).find('entry[id="' + entryId + '"]')[0]).remove();  
    currentTabEntryId = previousTabEntryId;
    // save the xml string in cache textarea
    $('#txtCache-' + notebookFileName).text((new XMLSerializer()).serializeToString(xmlDoc));
	saveNotebook(notebookFileName);
  };

  // remove an entry in xml
  function removeXmlEntry() {
    var removedTabEntryId = currentTabEntryId;
    var emptyNotebook = false;
    var notebookFileName = getNotebookFileName(currentTabEntryId);
    var entryId = getEntryId(currentTabEntryId);
    var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());
    var $entry = $(xmlDoc).find('entry[id="' + entryId + '"]')[0];    
    var $parentNode = $entry.parentNode;
    if ($parentNode.nodeName == 'notebook') {
      if ($entry.nextElementSibling == null) {
        if ($entry.previousElementSibling == null) {
          emptyNotebook = true;
        }
        else {
          currentTabEntryId = notebookFileName + '-' + $entry.previousElementSibling.getAttribute("id");
        }
      }
      else {
        currentTabEntryId = notebookFileName + '-' + $entry.nextElementSibling.getAttribute("id");        
      }
    }
    else {
      currentTabEntryId = notebookFileName + '-' + $parentNode.getAttribute("id");
    }
    $($entry).remove();  
    if (emptyNotebook) {
      $notebook = $(xmlDoc).find('notebook')[0];
      $notebook.setAttribute("nextEntryId", 2);    
      // create a new entry in xmlDoc, which will become the only entry of the notebook
      var entry = xmlDoc.createElement("entry");
      entry.setAttribute("id", 1);
      var entryTitle = xmlDoc.createElement("title");
      entry.appendChild(entryTitle);  
      var entryTitleCdata = xmlDoc.createCDATASection("");
      entryTitle.appendChild(entryTitleCdata);
      var entryContent = xmlDoc.createElement("content");
      entry.appendChild(entryContent);  
      var entryContentCdata = xmlDoc.createCDATASection("");
      entryContent.appendChild(entryContentCdata);
      $notebook.appendChild(entry);          
      currentTabEntryId = notebookFileName + '-1';
    }
    // save the xml string in cache textarea
    $('#txtCache-' + notebookFileName).text((new XMLSerializer()).serializeToString(xmlDoc));
	saveNotebook(notebookFileName);
    var removedXmlEntry = {"tabEntryId": removedTabEntryId, "emptyNotebook": emptyNotebook};
    return removedXmlEntry;
  };
  
  // remove an entry (and its children) in Html
  function removeHtmlEntry(removedXmlEntry) {
    $('.entry[id="' + removedXmlEntry.tabEntryId + '"]').remove();
    if (removedXmlEntry.emptyNotebook) {
      var notebookFileName = getNotebookFileName(currentTabEntryId);
      var entryId = getEntryId(currentTabEntryId);    
      $('#' + notebookFileName + 'Tab').append(createEntry(notebookFileName, entryId));
      $('#' + currentTabEntryId).collapsible();
    }
  };

  // scroll to the element with id = tabEntryId
  function goTo(tabEntryId) {
    collapseFromParent(tabEntryId);
    var offset = $('#' + tabEntryId).offset().top - $('#mainPageHeader').height();
    $.mobile.silentScroll(offset);
  };

  // display a particular element by expanding from its parents
  function collapseFromParent(tabEntryId) {
    var $entry = $('#' + tabEntryId);
    $entry.parents('[data-role="collapsible"]').collapsible("option", "collapsed", false);
    $entry.collapsible("option", "collapsed", false);
  };
  
  // search for the (n+1)th occurrence of a particular string
  function search(searchString, index) {
    var notebookFileName = getNotebookFileName(currentTabEntryId);  
    var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());
    var $entry = $(xmlDoc).find('title,content').filter(function() {
      return $(this).text().indexOf(searchString) >= 0;
    }).closest('entry');
    var id = '';
    var total = 0;
    if (typeof $entry[index] != 'undefined') {
      id = $entry[index].getAttribute("id");
      total = $entry.length;
    }
    return {"entryId": id, "total": total};        
  };

  // create the items in a listview that contains the siblings of currentTabEntryId
  function buildSiblingListview(listviewId) {
    var style = 'color: Blue';
    $('#' + listviewId + ' li').remove();
    var notebookFileName = getNotebookFileName(currentTabEntryId);
    var entryId = getEntryId(currentTabEntryId);
    var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());
    var parentElement = $(xmlDoc).find('entry[id="' + entryId + '"]')[0].parentNode;
    var parentEntryId = parentElement.getAttribute("id");
    if (parentEntryId == null) {   // current tab has no entry parent
      var titleElements = $(xmlDoc).find('notebook title');
      $.each(titleElements, function(key, value) {
        if (typeof value != 'undefined') {
          if (value.parentNode.parentNode.nodeName == 'notebook') {  // just select the immediate children of parent node
            if (value.childNodes.length > 0) {
              var id = value.parentNode.getAttribute("id");
              var title = value.childNodes[0].nodeValue;
              if (id == entryId) {
                $('<li data-name="' + id + '" style="' + style + '">' + title + '</li>').appendTo($('#' + listviewId)); 
              }
              else {
                $('<li data-name="' + id + '">' + title + '</li>').appendTo($('#' + listviewId));               
              }
            }          
          }  
        }
      });    
    }
    else {
      var titleElements = $(xmlDoc).find('entry[id="' + parentEntryId + '"] title');
      $.each(titleElements, function(key, value) {
        if (typeof value != 'undefined') {
          if (value.parentNode.parentNode.getAttribute("id") == parentEntryId) {  // just select the immediate children of parent node
            if (value.childNodes.length > 0) {
              var id = value.parentNode.getAttribute("id");
              var title = value.childNodes[0].nodeValue;
              if (id == entryId) {
                $('<li data-name="' + id + '" style="' + style + '">' + title + '</li>').appendTo($('#' + listviewId));
              }
              else {
                $('<li data-name="' + id + '">' + title + '</li>').appendTo($('#' + listviewId));
              }
            }          
          }       
        }
      });    
    }
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, listviewId]);               
  };
  
  // set cursor position in textbox
  function setCaretToPos(input, pos) {
    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(pos, pos);
    }
    else if (input.createTextRange) {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveStart('character', pos);
      range.moveEnd('character', pos);
      range.select();
    }
  };
  
  // check whether a file exists
  // "fileExists" and "fileDoesNotExist" are two callback functions
  function checkIfFileExists(fileFullPath, fileExists, fileDoesNotExist) {
  	var baseDir = getFileBasePath(fileFullPath, false);
	var fileName = getFileName(fileFullPath, true);
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onFail);
	function onSuccess(fileSystem) {
		fileSystem.root.getDirectory(baseDir, {create: false, exclusive: false}, onSuccess, onFail);
		function onSuccess(directoryEntry) {
			directoryEntry.getFile(fileName, {create: false, exclusive: false}, onSuccess, onFail);
			function onSuccess(fileEntry) {
				fileExists();
			};
			function onFail(error) {
				fileDoesNotExist();
			};
		};
		function onFail(error) {
			log(error.code);
		};
	};
	function onFail(event) {
		log(event.target.error.code);
	};
  };
  
  // retrieve the file name from the full path of a file
  // if withFileExtension = false, exclude the file extension
  function getFileName(fullPath, withFileExtension) {
    var result = fullPath.slice(fullPath.lastIndexOf('/')+1);
    if (!withFileExtension) {
      result = result.slice(0, result.lastIndexOf('.'));
    }
    return result;
  };

  // retrieve the base path from the full path of a file (excluding the last "/")
  // if withLeadingSlash = false, exclude the leading slash (if exists)
  function getFileBasePath(fullPath, withLeadingSlash) {
    var result = fullPath.slice(0, fullPath.lastIndexOf('/'));
	if ((!withLeadingSlash) && (result.indexOf('/') == 0)) {
		result = result.slice(1);
	}
	return result;
  };
  
  // read file
  function readFile(fullPath, callback) {
	var baseDir = getFileBasePath(fullPath, false);
	var fileName = getFileName(fullPath, true);
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onFail);
	function onSuccess(fileSystem) {
		fileSystem.root.getDirectory(baseDir, {create: false, exclusive: false}, onSuccess, onFail);
		function onSuccess(directoryEntry) {
			directoryEntry.getFile(fileName, {create: false, exclusive: false}, onSuccess, onFail);
			function onSuccess(fileEntry) {
				fileEntry.file(onSuccess, onFail);
				function onSuccess(file) {
					var reader = new FileReader();
					reader.onloadend = function(event) {
						callback(event.target.result);
					};
					reader.readAsText(file);
				};
				function onFail(error) {
					log(error.code);
				};
			};
			function onFail(error) {
				log(error.code);
			};
		};
		function onFail(error) {
			log(error.code);
		};
	};
	function onFail(event) {
		log(event.target.error.code);
	};
  };

  // write file
  function writeFile(fullPath, text, successCallback) {
  	var baseDir = getFileBasePath(fullPath, false);
	var fileName = getFileName(fullPath, true);
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onFail);
	function onSuccess(fileSystem) {
		fileSystem.root.getDirectory(baseDir, {create: true, exclusive: false}, onSuccess, onFail);
		function onSuccess(directoryEntry) {
			directoryEntry.getFile(fileName, {create: true, exclusive: false}, onSuccess, onFail);
			function onSuccess(fileEntry) {
				fileEntry.createWriter(onSuccess, onFail);
				function onSuccess(writer) {
					writer.write(text);
					successCallback();
				};
				function onFail(error) {
					log(error.code);
				};
			};
			function onFail(error) {
				log(error.code);
			};
		};
		function onFail(error) {
			log(error.code);
		};
	};
	function onFail(event) {
		log(event.target.error.code);
	};
  };
  
  // save xml to notebook
  function saveNotebook(notebookFileName) {
	if (!desktop) {
	  var notebookFullPath = $('#' + notebookFileName).data('fullpath');
	  writeFile(notebookFullPath, $('#txtCache-' + notebookFileName).text(), function(){});		
	}
  };
  
  // get the specific tab width of current notebook
  function getTabWidth(notebookFileName) {
	var tabWidth;
	if ((typeof tabWidthMap[notebookFileName] == 'undefined') || (isNaN(tabWidthMap[notebookFileName]))) {
	  if (desktop) {
		tabWidth = desktopTabWidth;
	  }
	  else {
	    var xmlDoc = $.parseXML($('#txtCache-' + notebookFileName).text());		  
        $notebook = $(xmlDoc).find('notebook')[0];
        tabWidth = $notebook.getAttribute("tabWidth");
  	    if ((typeof tabWidth == 'undefined') || (isNaN(tabWidth))) {
	      tabWidth = defaultTabWidth;
	    }
	    tabWidthMap[notebookFileName] = tabWidth;
	  }
	}
	else {		
	  tabWidth = tabWidthMap[notebookFileName];
	}
	return tabWidth;
  };
  