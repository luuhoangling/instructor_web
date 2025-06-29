import { create } from 'zustand';

// Store cho quản lý course tree và trạng thái ứng dụng
const useCourseStore = create((set, get) => ({
      // ==================== STATE ====================
      
      // Course data
      courses: [],
      currentCourse: null,
      courseTree: null,
      
      // UI state
      selectedNode: null,
      expandedKeys: [],
      selectedKeys: [],
      loadingStates: {
        courses: false,
        course: false,
        sections: false,
        lessons: false,
        quizzes: false,
        questions: false,
      },
      
      // Notification state
      notifications: [],
      
      // Undo/Redo state (cơ bản)
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,
      
      // Error state
      errors: {},
      
      // ==================== ACTIONS ====================
      
      // Loading states
      setLoading: (key, value) => 
        set((state) => ({
          ...state,
          loadingStates: {
            ...state.loadingStates,
            [key]: value
          }
        })),
      
      // Course actions
      setCourses: (courses) =>
        set((state) => ({
          ...state,
          courses
        })),
        
      setCurrentCourse: (course) =>
        set((state) => {
          let newCourseTree = null;
          // Build tree structure khi set course
          if (course) {
            newCourseTree = {
              key: `course-${course.id}`,
              title: course.title,
              type: 'course',
              data: course,
              children: (course.sections || []).map(section => ({
                key: `section-${section.id}`,
                title: section.title,
                type: 'section',
                data: section,
                children: [
                  // Lessons
                  ...(section.lessons || []).map(lesson => ({
                    key: `lesson-${lesson.id}`,
                    title: lesson.title,
                    type: 'lesson',
                    data: lesson,
                    isLeaf: true
                  })),
                  // Quizzes
                  ...(section.quizzes || []).map(quiz => ({
                    key: `quiz-${quiz.id}`,
                    title: quiz.title,
                    type: 'quiz',
                    data: quiz,
                    children: (quiz.questions || []).map(question => ({
                      key: `question-${question.id}`,
                      title: question.question_text || question.title,
                      type: 'question',
                      data: question,
                      isLeaf: true
                    }))
                  }))
                ]
              }))
            };
          }
          
          return {
            ...state,
            currentCourse: course,
            courseTree: newCourseTree
          };
        }),
      
      // Tree selection and expansion
      setSelectedNode: (node) =>
        set((state) => ({
          ...state,
          selectedNode: node,
          selectedKeys: node ? [node.key] : []
        })),
        
      setExpandedKeys: (keys) =>
        set((state) => ({
          ...state,
          expandedKeys: keys
        })),
      
      // Tree operations với lazy loading
      loadNodeChildren: async (node) => {
        const { type, data } = node;
        
        try {
          set((state) => ({
            ...state,
            loadingStates: {
              ...state.loadingStates,
              [`${type}s`]: true
            }
          }));
          
          // Lazy loading logic sẽ được implement ở component level
          // Store chỉ cập nhật state sau khi load xong
          
          return true;
        } catch (error) {
          console.error('Failed to load node children:', error);
          get().addNotification({
            type: 'error',
            message: `Failed to load ${type} children: ${error.message}`
          });
          return false;
        } finally {
          set((state) => ({
            ...state,
            loadingStates: {
              ...state.loadingStates,
              [`${type}s`]: false
            }
          }));
        }
      },
      
      // CRUD operations cho tree nodes
      addNode: (parentKey, newNode, nodeType) => {
        const currentState = get();
        // Save current state for undo
        currentState.saveToHistory();
        
        set((state) => {
          // Recursive function để tìm và thêm node
          const addToTree = (nodes, parentKey, newNode) => {
            return nodes.map(node => {
              if (node.key === parentKey) {
                return {
                  ...node,
                  children: [...(node.children || []), newNode]
                };
              } else if (node.children) {
                return {
                  ...node,
                  children: addToTree(node.children, parentKey, newNode)
                };
              }
              return node;
            });
          };
          
          let newCourseTree = state.courseTree;
          if (newCourseTree) {
            if (newCourseTree.key === parentKey) {
              newCourseTree = {
                ...newCourseTree,
                children: [...(newCourseTree.children || []), newNode]
              };
            } else {
              newCourseTree = {
                ...newCourseTree,
                children: addToTree(newCourseTree.children || [], parentKey, newNode)
              };
            }
          }
          
          return {
            ...state,
            courseTree: newCourseTree
          };
        });
      },
      
      updateNode: (nodeKey, updatedData) => {
        const currentState = get();
        // Save current state for undo
        currentState.saveToHistory();
        
        set((state) => {
          // Recursive function để tìm và update node
          const updateInTree = (nodes, nodeKey, updatedData) => {
            return nodes.map(node => {
              if (node.key === nodeKey) {
                return {
                  ...node,
                  title: updatedData.title || node.title,
                  data: { ...node.data, ...updatedData }
                };
              } else if (node.children) {
                return {
                  ...node,
                  children: updateInTree(node.children, nodeKey, updatedData)
                };
              }
              return node;
            });
          };
          
          let newCourseTree = state.courseTree;
          if (newCourseTree) {
            if (newCourseTree.key === nodeKey) {
              newCourseTree = {
                ...newCourseTree,
                title: updatedData.title || newCourseTree.title,
                data: { ...newCourseTree.data, ...updatedData }
              };
            } else {
              newCourseTree = {
                ...newCourseTree,
                children: updateInTree(newCourseTree.children || [], nodeKey, updatedData)
              };
            }
          }
          
          return {
            ...state,
            courseTree: newCourseTree
          };
        });
      },
      
      deleteNode: (nodeKey) => {
        const currentState = get();
        // Save current state for undo
        currentState.saveToHistory();
        
        set((state) => {
          // Recursive function để tìm và xóa node
          const deleteFromTree = (nodes, nodeKey) => {
            return nodes.filter(node => {
              if (node.key === nodeKey) {
                return false;
              } else if (node.children) {
                const updatedNode = {
                  ...node,
                  children: deleteFromTree(node.children, nodeKey)
                };
                return updatedNode;
              }
              return node;
            });
          };
          
          let newCourseTree = state.courseTree;
          let newSelectedNode = state.selectedNode;
          let newSelectedKeys = state.selectedKeys;
          
          if (newCourseTree && newCourseTree.children) {
            newCourseTree = {
              ...newCourseTree,
              children: deleteFromTree(newCourseTree.children, nodeKey)
            };
          }
          
          // Clear selection if deleted node was selected
          if (state.selectedNode?.key === nodeKey) {
            newSelectedNode = null;
            newSelectedKeys = [];
          }
          
          return {
            ...state,
            courseTree: newCourseTree,
            selectedNode: newSelectedNode,
            selectedKeys: newSelectedKeys
          };
        });
      },
      
      // Drag & Drop support
      moveNode: (dragKey, dropKey, dropPosition) =>
        set((state) => {
          // Save current state for undo
          get().saveToHistory();
          
          // Implementation for drag & drop will be added
          // This is a placeholder for the tree reorganization logic
          console.log('Moving node:', { dragKey, dropKey, dropPosition });
        }),
      
      // Notification system
      addNotification: (notification) =>
        set((state) => {
          const id = Date.now().toString();
          return {
            ...state,
            notifications: [
              ...state.notifications,
              {
                id,
                timestamp: new Date(),
                ...notification
              }
            ]
          };
        }),
        
      removeNotification: (id) =>
        set((state) => ({
          ...state,
          notifications: state.notifications.filter(n => n.id !== id)
        })),
      
      clearNotifications: () =>
        set((state) => ({
          ...state,
          notifications: []
        })),
      
      // Error handling
      setError: (key, error) =>
        set((state) => ({
          ...state,
          errors: {
            ...state.errors,
            [key]: error
          }
        })),
        
      clearError: (key) =>
        set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[key];
          return {
            ...state,
            errors: newErrors
          };
        }),
        
      clearAllErrors: () =>
        set((state) => ({
          ...state,
          errors: {}
        })),
      
      // Undo/Redo functionality (cơ bản)
      saveToHistory: () => {
        const currentState = get();
        const historyState = {
          courseTree: currentState.courseTree,
          currentCourse: currentState.currentCourse,
          timestamp: Date.now()
        };
        
        set((state) => {
          let newHistory = [...state.history];
          let newHistoryIndex = state.historyIndex;
          
          // Remove future history if we're not at the end
          if (newHistoryIndex < newHistory.length - 1) {
            newHistory = newHistory.slice(0, newHistoryIndex + 1);
          }
          
          // Add new state
          newHistory.push(historyState);
          
          // Limit history size
          if (newHistory.length > state.maxHistorySize) {
            newHistory = newHistory.slice(-state.maxHistorySize);
          }
          
          newHistoryIndex = newHistory.length - 1;
          
          return {
            ...state,
            history: newHistory,
            historyIndex: newHistoryIndex
          };
        });
      },
      
      undo: () => {
        const currentState = get();
        if (currentState.historyIndex > 0) {
          set((state) => {
            const newHistoryIndex = state.historyIndex - 1;
            const previousState = state.history[newHistoryIndex];
            return {
              ...state,
              historyIndex: newHistoryIndex,
              courseTree: previousState.courseTree,
              currentCourse: previousState.currentCourse
            };
          });
        }
      },
      
      redo: () => {
        const currentState = get();
        if (currentState.historyIndex < currentState.history.length - 1) {
          set((state) => {
            const newHistoryIndex = state.historyIndex + 1;
            const nextState = state.history[newHistoryIndex];
            return {
              ...state,
              historyIndex: newHistoryIndex,
              courseTree: nextState.courseTree,
              currentCourse: nextState.currentCourse
            };
          });
        }
      },
      
      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
      
      // Reset store
      reset: () =>
        set(() => ({
          courses: [],
          currentCourse: null,
          courseTree: null,
          selectedNode: null,
          expandedKeys: [],
          selectedKeys: [],
          loadingStates: {
            courses: false,
            course: false,
            sections: false,
            lessons: false,
            quizzes: false,
            questions: false,
          },
          notifications: [],
          errors: {},
          history: [],
          historyIndex: -1,
          maxHistorySize: 50
        }))
      }))

// Selectors để optimize re-renders
export const useCoursesSelector = () => useCourseStore((state) => state.courses);
export const useCurrentCourseSelector = () => useCourseStore((state) => state.currentCourse);
export const useCourseTreeSelector = () => useCourseStore((state) => state.courseTree);
export const useSelectedNodeSelector = () => useCourseStore((state) => state.selectedNode);
export const useLoadingSelector = () => useCourseStore((state) => state.loadingStates);
export const useNotificationsSelector = () => useCourseStore((state) => state.notifications);
export const useErrorsSelector = () => useCourseStore((state) => state.errors);

export default useCourseStore;
