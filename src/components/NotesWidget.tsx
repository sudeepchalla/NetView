import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FaStickyNote,
  FaTimes,
  FaExpandAlt,
  FaCompressAlt,
  FaTrash,
} from "react-icons/fa";

export function NotesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const savedNote = localStorage.getItem("recon-buddy-notes");
    if (savedNote) {
      setNote(savedNote);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("recon-buddy-notes", note);
  }, [note]);

  const toggleOpen = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleClearNotes = () => {
    setNote("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
      {isOpen && (
        <Card
          className={`transition-all duration-300 shadow-2xl border-primary/20 bg-background p-0 gap-0 ${
            isExpanded ? "w-[80vw] h-[80vh]" : "w-80 h-96"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FaStickyNote className="text-primary" />
              Quick Notes
            </CardTitle>
            <div className="flex items-center gap-1">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon-sm" title="Clear notes">
                    <FaTrash className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Notes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your current notes. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearNotes}>
                      Clear Notes
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleExpand}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <FaCompressAlt className="h-3 w-3" />
                ) : (
                  <FaExpandAlt className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleOpen}
                title="Close"
              >
                <FaTimes className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-3.5rem)]">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Type your notes here..."
              className="w-full h-full resize-none border-0 focus-visible:ring-0 text-base p-4 bg-transparent rounded-t-none"
            />
          </CardContent>
        </Card>
      )}

      <Button
        onClick={toggleOpen}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-primary/25 transition-all duration-300"
      >
        {isOpen ? (
          <FaTimes className="h-6 w-6" />
        ) : (
          <FaStickyNote className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
